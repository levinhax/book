/**
 * @author Kuitos
 * @since 2020-04-01
 */

import { importEntry } from 'import-html-entry';
import { concat, forEach, mergeWith } from 'lodash';
import type { LifeCycles, ParcelConfigObject } from 'single-spa';
import getAddOns from './addons';
import { QiankunError } from './error';
import { getMicroAppStateActions } from './globalState';
import type {
  FrameworkConfiguration,
  FrameworkLifeCycles,
  HTMLContentRender,
  LifeCycleFn,
  LoadableApp,
  ObjectType,
} from './interfaces';
import { createSandboxContainer, css } from './sandbox';
import {
  Deferred,
  getContainer,
  getDefaultTplWrapper,
  getWrapperId,
  isEnableScopedCSS,
  performanceMark,
  performanceMeasure,
  performanceGetEntriesByName,
  toArray,
  validateExportLifecycle,
} from './utils';

function assertElementExist(element: Element | null | undefined, msg?: string) {
  if (!element) {
    if (msg) {
      throw new QiankunError(msg);
    }

    throw new QiankunError('element not existed!');
  }
}

function execHooksChain<T extends ObjectType>(
  hooks: Array<LifeCycleFn<T>>,
  app: LoadableApp<T>,
  global = window,
): Promise<any> {
  if (hooks.length) {
    return hooks.reduce((chain, hook) => chain.then(() => hook(app, global)), Promise.resolve());
  }

  return Promise.resolve();
}

async function validateSingularMode<T extends ObjectType>(
  validate: FrameworkConfiguration['singular'],
  app: LoadableApp<T>,
): Promise<boolean> {
  return typeof validate === 'function' ? validate(app) : !!validate;
}

// @ts-ignore
const supportShadowDOM = document.head.attachShadow || document.head.createShadowRoot;

function createElement(
  appContent: string,
  strictStyleIsolation: boolean,
  scopedCSS: boolean,
  appName: string,
): HTMLElement {
  const containerElement = document.createElement('div');
  containerElement.innerHTML = appContent;
  // appContent always wrapped with a singular div
  const appElement = containerElement.firstChild as HTMLElement;
  if (strictStyleIsolation) {
    if (!supportShadowDOM) {
      console.warn(
        '[qiankun]: As current browser not support shadow dom, your strictStyleIsolation configuration will be ignored!',
      );
    } else {
      const { innerHTML } = appElement;
      appElement.innerHTML = '';
      let shadow: ShadowRoot;
      // Element.attachShadow() 方法给指定的元素挂载一个Shadow DOM，并且返回对 ShadowRoot 的引用。
      // shadow dom 是样式隔离的

      if (appElement.attachShadow) {
        shadow = appElement.attachShadow({ mode: 'open' });
      } else {
        // createShadowRoot was proposed in initial spec, which has then been deprecated
        shadow = (appElement as any).createShadowRoot();
      }
      shadow.innerHTML = innerHTML;
    }
  }

  if (scopedCSS) {
    const attr = appElement.getAttribute(css.QiankunCSSRewriteAttr);
    if (!attr) {
      appElement.setAttribute(css.QiankunCSSRewriteAttr, appName);
    }

    const styleNodes = appElement.querySelectorAll('style') || [];
    forEach(styleNodes, (stylesheetElement: HTMLStyleElement) => {
      css.process(appElement!, stylesheetElement, appName);
    });
  }

  return appElement;
}

/** generate app wrapper dom getter */
function getAppWrapperGetter(
  appName: string,
  appInstanceId: string,
  useLegacyRender: boolean,
  strictStyleIsolation: boolean,
  scopedCSS: boolean,
  elementGetter: () => HTMLElement | null,
) {
  return () => {
    if (useLegacyRender) {
      if (strictStyleIsolation) throw new QiankunError('strictStyleIsolation can not be used with legacy render!');
      if (scopedCSS) throw new QiankunError('experimentalStyleIsolation can not be used with legacy render!');

      const appWrapper = document.getElementById(getWrapperId(appInstanceId));
      assertElementExist(appWrapper, `Wrapper element for ${appName} with instance ${appInstanceId} is not existed!`);
      return appWrapper!;
    }

    const element = elementGetter();
    assertElementExist(element, `Wrapper element for ${appName} with instance ${appInstanceId} is not existed!`);

    // 如果是 strictStyleIsolation 模式，返回的是 element!.shadowRoot!
    // ! 表示匿名函数执行
    if (strictStyleIsolation && supportShadowDOM) {
      return element!.shadowRoot!;
    }

    return element!;
  };
}

const rawAppendChild = HTMLElement.prototype.appendChild;
const rawRemoveChild = HTMLElement.prototype.removeChild;
type ElementRender = (
  props: { element: HTMLElement | null; loading: boolean; container?: string | HTMLElement },
  phase: 'loading' | 'mounting' | 'mounted' | 'unmounted',
) => any;

/**
 * Get the render function
 * If the legacy render function is provide, used as it, otherwise we will insert the app element to target container by qiankun
 * @param appName
 * @param appContent
 * @param legacyRender
 */
function getRender(appName: string, appContent: string, legacyRender?: HTMLContentRender) {
  // 定义一个 render 方法
  const render: ElementRender = ({ element, loading, container }, phase) => {
    // 自定义 render 是不推荐的
    if (legacyRender) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '[qiankun] Custom rendering function is deprecated, you can use the container element setting instead!',
        );
      }

      return legacyRender({ loading, appContent: element ? appContent : '' });
    }

    // 使用 document.querySelector 获得 dom 节点
    const containerElement = getContainer(container!);

    // The container might have be removed after micro app unmounted.
    // Such as the micro app unmount lifecycle called by a react componentWillUnmount lifecycle, after micro app unmounted, the react component might also be removed
    if (phase !== 'unmounted') {
      const errorMsg = (() => {
        switch (phase) {
          case 'loading':
          case 'mounting':
            return `Target container with ${container} not existed while ${appName} ${phase}!`;

          case 'mounted':
            return `Target container with ${container} not existed after ${appName} ${phase}!`;

          default:
            return `Target container with ${container} not existed while ${appName} rendering!`;
        }
      })();
      assertElementExist(containerElement, errorMsg);
    }

    // containerElement 中没有 element
    if (containerElement && !containerElement.contains(element)) {
      // clear the container
      // 清空 containerElement 子节点
      while (containerElement!.firstChild) {
        rawRemoveChild.call(containerElement, containerElement!.firstChild);
      }

      // append the element to container if it exist
      if (element) {
        // 使用原生 appendChild 方法
        rawAppendChild.call(containerElement, element);
      }
    }

    return undefined;
  };

  return render;
}

function getLifecyclesFromExports(
  scriptExports: LifeCycles<any>,
  appName: string,
  global: WindowProxy,
  globalLatestSetProp?: PropertyKey | null,
) {
  if (validateExportLifecycle(scriptExports)) {
    return scriptExports;
  }

  // fallback to sandbox latest set property if it had
  if (globalLatestSetProp) {
    const lifecycles = (<any>global)[globalLatestSetProp];
    if (validateExportLifecycle(lifecycles)) {
      return lifecycles;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[qiankun] lifecycle not found from ${appName} entry exports, fallback to get from window['${appName}']`,
    );
  }

  // fallback to global variable who named with ${appName} while module exports not found
  const globalVariableExports = (global as any)[appName];

  if (validateExportLifecycle(globalVariableExports)) {
    return globalVariableExports;
  }

  throw new QiankunError(`You need to export lifecycle functions in ${appName} entry`);
}

let prevAppUnmountedDeferred: Deferred<void>;

export type ParcelConfigObjectGetter = (remountContainer?: string | HTMLElement) => ParcelConfigObject;

export async function loadApp<T extends ObjectType>(
  app: LoadableApp<T>,
  configuration: FrameworkConfiguration = {},
  lifeCycles?: FrameworkLifeCycles<T>,
): Promise<ParcelConfigObjectGetter> {
  const { entry, name: appName } = app;
  const appInstanceId = `${appName}_${+new Date()}_${Math.floor(Math.random() * 1000)}`;

  const markName = `[qiankun] App ${appInstanceId} Loading`;
  if (process.env.NODE_ENV === 'development') {
    performanceMark(markName);
  }

  const {
    singular = false,
    sandbox = true,
    excludeAssetFilter,
    globalContext = window,
    ...importEntryOpts
  } = configuration;

  // get the entry html content and script executor
  // 使用 import-html-entry 加载入口文件
  const { template, execScripts, assetPublicPath } = await importEntry(entry, importEntryOpts);

  // as single-spa load and bootstrap new app parallel with other apps unmounting
  // (see https://github.com/CanopyTax/single-spa/blob/master/src/navigation/reroute.js#L74)
  // we need wait to load the app until all apps are finishing unmount in singular mode
  if (await validateSingularMode(singular, app)) {
    await (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise);
  }

  // 将 template 文件外层包裹一个 div，id 为 appInstanceId
  const appContent = getDefaultTplWrapper(appInstanceId, appName)(template);

  // 定义render方法，微应用挂在到主应用 dom 节点的方式，是否严格隔离模式
  const strictStyleIsolation = typeof sandbox === 'object' && !!sandbox.strictStyleIsolation;
  const scopedCSS = isEnableScopedCSS(sandbox);

  // createElement方法
  // 创建子应用节点，document.createElement
  // 如果使用了 strictStyleIsolation，appElement.attachShadow
  let initialAppWrapperElement: HTMLElement | null = createElement(
    appContent,
    strictStyleIsolation,
    scopedCSS,
    appName,
  );

  // container 就是子应用加载的节点，使我们配置的
  const initialContainer = 'container' in app ? app.container : undefined;
  // render 我们自定义的渲染规则，不推荐使用
  const legacyRender = 'render' in app ? app.render : undefined;

  // 返回一个 render 方法
  const render = getRender(appName, appContent, legacyRender);

  // 第一次加载设置应用可见区域 dom 结构
  // 确保每次应用加载前容器 dom 结构已经设置完毕
  render({ element: initialAppWrapperElement, loading: true, container: initialContainer }, 'loading');

  // containerGetter 方法可以获得 element
  // 对于严格的隔离方式，containerGetter 返回的是 shadowDom root
  const initialAppWrapperGetter = getAppWrapperGetter(
    appName,
    appInstanceId,
    !!legacyRender,
    strictStyleIsolation,
    scopedCSS,
    () => initialAppWrapperElement,
  );

  // global 代表 window const { ..., globalContext = window, ... } = configuration;
  let global = globalContext;
  let mountSandbox = () => Promise.resolve();
  let unmountSandbox = () => Promise.resolve();
  const useLooseSandbox = typeof sandbox === 'object' && !!sandbox.loose;
  let sandboxContainer;
  // 如果使用沙箱，上下文隔离
  if (sandbox) {
    sandboxContainer = createSandboxContainer(
      appName,
      // FIXME should use a strict sandbox logic while remount, see https://github.com/umijs/qiankun/issues/518
      initialAppWrapperGetter,
      scopedCSS,
      useLooseSandbox,
      excludeAssetFilter,
      global,
    );
    // 用沙箱的代理对象作为接下来使用的全局对象
    global = sandboxContainer.instance.proxy as typeof window;
    mountSandbox = sandboxContainer.mount;
    unmountSandbox = sandboxContainer.unmount;
  }

  // lodash mergeWith 方法，使用定制程序函数，该函数将被调用以生成给定目标和源属性的合并值
  // beforeUnmount 等方法增加了 qiankun 的逻辑
  // lifeCycles 是用户进行 registerMicroApps 时候传的函数
  const {
    beforeUnmount = [],
    afterUnmount = [],
    afterMount = [],
    beforeMount = [],
    beforeLoad = [],
  } = mergeWith({}, getAddOns(global, assetPublicPath), lifeCycles, (v1, v2) => concat(v1 ?? [], v2 ?? []));

  // 轮流执行 app 上的 beforeLoad 方法
  await execHooksChain(toArray(beforeLoad), app, global);

  // get the lifecycle hooks from module exports
  // 执行该模板文件中所有的 JS 脚本文件
  // global指定作用域
  // 执行 export 的东西会挂载到作用域上
  const scriptExports: any = await execScripts(global, sandbox && !useLooseSandbox);
  const { bootstrap, mount, unmount, update } = getLifecyclesFromExports(
    scriptExports,
    appName,
    global,
    sandboxContainer?.instance?.latestSetProp,
  );

  // 获得子应用的生命周期函数
  // onGlobalStateChange 全局依赖监听
  const { onGlobalStateChange, setGlobalState, offGlobalStateChange }: Record<string, CallableFunction> =
    getMicroAppStateActions(appInstanceId);

  // FIXME temporary way
  const syncAppWrapperElement2Sandbox = (element: HTMLElement | null) => (initialAppWrapperElement = element);

  const parcelConfigGetter: ParcelConfigObjectGetter = (remountContainer = initialContainer) => {
    let appWrapperElement: HTMLElement | null;
    let appWrapperGetter: ReturnType<typeof getAppWrapperGetter>;

    // parcelConfig 就是最终的 app 的配置
    const parcelConfig: ParcelConfigObject = {
      name: appInstanceId,
      bootstrap,
      mount: [
        async () => {
          if (process.env.NODE_ENV === 'development') {
            const marks = performanceGetEntriesByName(markName, 'mark');
            // mark length is zero means the app is remounting
            if (marks && !marks.length) {
              performanceMark(markName);
            }
          }
        },
        async () => {
          // 如果是 singular 模式，那么一个应用挂载后会阻止其余应用的挂载
          if ((await validateSingularMode(singular, app)) && prevAppUnmountedDeferred) {
            return prevAppUnmountedDeferred.promise;
          }

          return undefined;
        },
        // initial wrapper element before app mount/remount
        // 添加 mount hook, 确保每次应用加载前容器 dom 结构已经设置完毕
        async () => {
          appWrapperElement = initialAppWrapperElement;
          appWrapperGetter = getAppWrapperGetter(
            appName,
            appInstanceId,
            !!legacyRender,
            strictStyleIsolation,
            scopedCSS,
            () => appWrapperElement,
          );
        },
        // 添加 mount hook, 确保每次应用加载前容器 dom 结构已经设置完毕
        async () => {
          const useNewContainer = remountContainer !== initialContainer;
          if (useNewContainer || !appWrapperElement) {
            // element will be destroyed after unmounted, we need to recreate it if it not exist
            // or we try to remount into a new container
            appWrapperElement = createElement(appContent, strictStyleIsolation, scopedCSS, appName);
            syncAppWrapperElement2Sandbox(appWrapperElement);
          }

          render({ element: appWrapperElement, loading: true, container: remountContainer }, 'mounting');
        },
        mountSandbox, // 加入沙箱支持
        // exec the chain after rendering to keep the behavior with beforeLoad
        async () => execHooksChain(toArray(beforeMount), app, global),
        // 这个 mount 是用户自定义的生命周期函数
        async (props) => mount({ ...props, container: appWrapperGetter(), setGlobalState, onGlobalStateChange }),
        // finish loading after app mounted
        // 应用 mount 完成后结束 loading
        async () => render({ element: appWrapperElement, loading: false, container: remountContainer }, 'mounted'),
        // 执行 afterMount
        async () => execHooksChain(toArray(afterMount), app, global),
        // initialize the unmount defer after app mounted and resolve the defer after it unmounted
        // 如果是 singular，设置 prevAppUnmountedDeferred，用于组织其他应用 mount
        async () => {
          if (await validateSingularMode(singular, app)) {
            prevAppUnmountedDeferred = new Deferred<void>();
          }
        },
        async () => {
          if (process.env.NODE_ENV === 'development') {
            const measureName = `[qiankun] App ${appInstanceId} Loading Consuming`;
            performanceMeasure(measureName, markName);
          }
        },
      ],
      // unmount 和 mount 对应
      unmount: [
        async () => execHooksChain(toArray(beforeUnmount), app, global),
        async (props) => unmount({ ...props, container: appWrapperGetter() }),
        unmountSandbox,
        async () => execHooksChain(toArray(afterUnmount), app, global),
        async () => {
          render({ element: null, loading: false, container: remountContainer }, 'unmounted');
          offGlobalStateChange(appInstanceId);
          // for gc
          appWrapperElement = null;
          syncAppWrapperElement2Sandbox(appWrapperElement);
        },
        async () => {
          if ((await validateSingularMode(singular, app)) && prevAppUnmountedDeferred) {
            prevAppUnmountedDeferred.resolve();
          }
        },
      ],
    };

    if (typeof update === 'function') {
      parcelConfig.update = update;
    }

    return parcelConfig;
  };

  return parcelConfigGetter;
}
