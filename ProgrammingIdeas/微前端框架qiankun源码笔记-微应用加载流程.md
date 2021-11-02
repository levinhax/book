## 微应用加载流程

微应用在注册的时候，qiankun 确定了微应用加载并嵌入主应用的方式，也就是 registerApplication 方法的第二个参数。
```
// registerApplication 方法来自于 single-spa
registerApplication({
  name,
  app: async () => {
    // 设置 loading
    loader(true);
    await frameworkStartedDefer.promise;

    // 获得 app 的配置
    const { mount, ...otherMicroAppConfigs } = await loadApp(
      { name, props, ...appConfig },
      frameworkConfiguration,
      lifeCycles,
    );

    // mount 方法前后设置 loader
    return {
      mount: [async () => loader(true), ...toArray(mount), async () => loader(false)],
      ...otherMicroAppConfigs,
    };
  },
  activeWhen: activeRule,
  customProps: props,
});
```

loadApp 会返回微应用的一些配置和生命周期函数，这些生命周期函数由 signle-spa 控制调用。qiankun 可以配置 beforeLoad，beforeMount，afterMount，beforeUnmount，afterUnmount 这五个生命周期函数。注意将五个生命周期函数和 single-spa 中的生命周期函数做区分。

loadApp 做了这么几件事:

1. 使用 import-html-entry 加载入口文件。
2. 定义 rneder 方法，也就是微应用挂在到主应用 dom 节点的方式，如果配置了严格隔离模式，使用 shadow dom 作为微应用的根节点，实现 css 隔离，如果不使用严格隔离模式，使用 div 作为根节点。
3. 定义沙箱的加载和卸载方法。
4. beforeLoad 或 beforeMount 生命周期函数增加一些逻辑：在 global 上，也就是 windows 上，增加INJECTED_PUBLIC_PATH_BY_QIANKUN 字段，表示微应用当前是由主应用控制的。
5. 执行 beforeLoad 函数。
6. 执行入口模板文件中所有的 JS 脚本文件，返回值放在当前的 windows 对象上（使用 sandbox 的话就是一个 proxy）
7. 由于 single spa 要求 laodApp 的返回值中必须有 bootstrap，mount，unmount 这三个生命周期函数，所以 qiankun 将 beforeMount，afterMount，beforeUnmount，afterUnmount 这四个生命周期函数转换为 mount 和 unmount。

mount 中需要执行以下步骤：

1. 如果是 singular 模式，那么阻止其余应用的挂载。
2. 执行 render 方法，实现 dom 挂载。
3. 执行 beforeMount 方法，来自于微应用注册时指定。
4. 启动沙箱支持。
5. 执行 mount 方法，来自于微应用入口文件指定。
6. 执行 afterMount 方法，来自于微应用注册时指定。

unmount 中需要执行以下步骤（与 mount 对应）：

1. 执行 unmount 方法，来自于微应用入口文件指定。
2. 卸载沙箱。
3. 执行 afterUnmount 方法，来自于微应用注册时指定（这一步应该放到第 4 步之后，感觉是源码问题）。
4. 执行 render 方法，render 的值为 null。
5. 如果是 singular 模式，允许其它应用加载。

```
export async function loadApp<T extends object>(
  app: LoadableApp<T>,
  configuration: FrameworkConfiguration = {},
  lifeCycles?: FrameworkLifeCycles<T>,
): Promise<ParcelConfigObject> {
  // 
  const { entry, name: appName } = app;
  const { singular = false, sandbox = true, ...importEntryOpts } = configuration;

  // get the entry html content and script executor
  // importEntry 方法的提供方是 import-html-entry, entry 是我们配置的地址
  // template 将脚本文件内容注释后的 html 模板文件
  // execScripts 方法：执行该模板文件中所有的 JS 脚本文件，并且可以指定脚本的作用域 - proxy 对象
  // assetPublicPath 资源地址根路径，可用于加载子应用资源
  const { template, execScripts, assetPublicPath } = await importEntry(entry, importEntryOpts);

  // as single-spa load and bootstrap new app parallel with other apps unmounting
  // (see https://github.com/CanopyTax/single-spa/blob/master/src/navigation/reroute.js#L74)
  // we need wait to load the app until all apps are finishing unmount in singular mode
  if (await validateSingularMode(singular, app)) {
    await (prevAppUnmountedDeferred && prevAppUnmountedDeferred.promise);
  }

  const appInstanceId = `${appName}_${+new Date()}`;

  // 严格的隔离方式，css 样式也需要隔离
  const strictStyleIsolation = typeof sandbox === 'object' && !!sandbox.strictStyleIsolation;

  // 将 template 文件外层包裹一个 div，该 div 的 id 是 appInstanceId
  const appContent = getDefaultTplWrapper(appInstanceId)(template);

  // 创建子应用节点，document.createElement
  // 如果使用了 strictStyleIsolation，appElement.attachShadow
  let element: HTMLElement | null = createElement(appContent, strictStyleIsolation);

  // container 就是子应用加载的节点，使我们配置的
  const container = 'container' in app ? app.container : undefined;
  // render 使我们自定义的渲染规则，是不推荐的
  const legacyRender = 'render' in app ? app.render : undefined;

  // 返回一个 render 方法
  const render = getRender(appName, appContent, container, legacyRender);

  // 第一次加载设置应用可见区域 dom 结构
  // 确保每次应用加载前容器 dom 结构已经设置完毕
  render({ element, loading: true }, 'loading');

  // containerGetter 方法可以获得 element
  // 对于严格的隔离方式，containerGetter 返回的是 shadowDom root
  const containerGetter = getAppWrapperGetter(
    appName,
    appInstanceId,
    !!legacyRender,
    strictStyleIsolation,
    () => element,
  );

  // global 代表 window
  let global: Window = window;
  let mountSandbox = () => Promise.resolve();
  let unmountSandbox = () => Promise.resolve();

  // 如果使用沙箱，也就是要求上下文隔离
  if (sandbox) {
    const sandboxInstance = createSandbox(appName, containerGetter, Boolean(singular));
    // 用沙箱的代理对象作为接下来使用的全局对象
    global = sandboxInstance.proxy;
    mountSandbox = sandboxInstance.mount;
    unmountSandbox = sandboxInstance.unmount;
  }

  // lodash mergeWith 方法
  // beforeUnmount 等方法增加了 qiankun 的逻辑
  const { beforeUnmount = [], afterUnmount = [], afterMount = [], beforeMount = [], beforeLoad = [] } = mergeWith(
    {},
    getAddOns(global, assetPublicPath),
    // lifeCycles 是用户进行 registerMicroApps 时候传的函数
    lifeCycles,
    (v1, v2) => concat(v1 ?? [], v2 ?? []),
  );

  // 轮流执行 app 上的 beforeLoad 方法
  await execHooksChain(toArray(beforeLoad), app);

  // get the lifecycle hooks from module exports
  // 执行该模板文件中所有的 JS 脚本文件
  // global 指定作用域
  // 执行 export 的东西会挂载到作用域上
  const scriptExports: any = await execScripts(global, !singular);

  // 获得子应用的生命周期函数
  const { bootstrap, mount, unmount, update } = getLifecyclesFromExports(scriptExports, appName, global);

  // onGlobalStateChange 全局依赖监听
  const {
    onGlobalStateChange,
    setGlobalState,
    offGlobalStateChange,
  }: Record<string, Function> = getMicroAppStateActions(appInstanceId);

  // parcelConfig 就是最终的 app 的配置
  const parcelConfig: ParcelConfigObject = {
    name: appInstanceId,
    // bootstrap 方法未做修改
    bootstrap,
    mount: [
      async () => {
        // 如果是 singular 模式，那么一个应用挂载后会阻止其余应用的挂载
        if ((await validateSingularMode(singular, app)) && prevAppUnmountedDeferred) {
          return prevAppUnmountedDeferred.promise;
        }

        return undefined;
      },
      // 添加 mount hook, 确保每次应用加载前容器 dom 结构已经设置完毕
      async () => {
        // element would be destroyed after unmounted, we need to recreate it if it not exist
        element = element || createElement(appContent, strictStyleIsolation);
        render({ element, loading: true }, 'mounting');
      },
      // exec the chain after rendering to keep the behavior with beforeLoad
      async () => execHooksChain(toArray(beforeMount), app),

      // 加入沙箱支持
      mountSandbox,

      // 这个 mount 是用户自定义的生命周期函数
      async props => mount({ ...props, container: containerGetter(), setGlobalState, onGlobalStateChange }),

      // 应用 mount 完成后结束 loading
      async () => render({ element, loading: false }, 'mounted'),

      // 执行 afterMount
      async () => execHooksChain(toArray(afterMount), app),
      // initialize the unmount defer after app mounted and resolve the defer after it unmounted
      // 如果是 singular，设置 prevAppUnmountedDeferred，用于组织其他应用 mount
      async () => {
        if (await validateSingularMode(singular, app)) {
          prevAppUnmountedDeferred = new Deferred<void>();
        }
      },
    ],

    // unmount 和 mount 对应
    unmount: [
      async () => execHooksChain(toArray(beforeUnmount), app),
      async props => unmount({ ...props, container: containerGetter() }),
      unmountSandbox,
      async () => execHooksChain(toArray(afterUnmount), app),
      async () => {
        render({ element: null, loading: false }, 'unmounted');
        offGlobalStateChange(appInstanceId);
        // for gc
        element = null;
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
}
```

createElement 使用 document.createElement 创建元素，如果使用严格隔离模式的话，会通过 attachShadow 创建 Shadow DOM，然后将元素挂在 Shadow DOM 中。
```
function createElement(appContent: string, strictStyleIsolation: boolean): HTMLElement {
  const containerElement = document.createElement('div');
  containerElement.innerHTML = appContent;
  // appContent always wrapped with a singular div
  const appElement = containerElement.firstChild as HTMLElement;

  // 严格隔离模式
  if (strictStyleIsolation) {
    // 检查浏览器是否支持 ShadowDOM
    if (!supportShadowDOM) {
      console.warn(
        '[qiankun]: As current browser not support shadow dom, your strictStyleIsolation configuration will be ignored!',
      );
    } else {
      const { innerHTML } = appElement;
      appElement.innerHTML = '';

      // Element.attachShadow() 方法给指定的元素挂载一个Shadow DOM，并且返回对 ShadowRoot 的引用。
      // 注意了，shadow dom 是样式隔离的
      const shadow = appElement.attachShadow({ mode: 'open' });
      shadow.innerHTML = innerHTML;
    }
  }

  return appElement;
}
```

getRender 生成了一个 render 方法，该 render 方法默认情况下使用 使用 document.querySelector 获得 dom 挂载节点，清空该节点子节点，然后 使用原生 appendChild 方法将 element 添加到挂载节点下。
```
function getRender(
  appName: string,
  appContent: string,
  container?: string | HTMLElement,
  legacyRender?: HTMLContentRender,
) {
  // 定义一个 render 方法
  const render: ElementRender = ({ element, loading }, phase) => {
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
    const containerElement = typeof container === 'string' ? document.querySelector(container) : container;

    // The container might have be removed after micro app unmounted.
    // Such as the micro app unmount lifecycle called by a react componentWillUnmount lifecycle, after micro app unmounted, the react component might also be removed
    if (phase !== 'unmounted') {
      const errorMsg = (() => {
        switch (phase) {
          case 'loading':
          case 'mounting':
            return `[qiankun] Target container with ${container} not existed while ${appName} ${phase}!`;

          case 'mounted':
            return `[qiankun] Target container with ${container} not existed after ${appName} ${phase}!`;

          default:
            return `[qiankun] Target container with ${container} not existed while ${appName} rendering!`;
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
        // const rawAppendChild = HTMLElement.prototype.appendChild;
        // 使用原生 appendChild 方法
        rawAppendChild.call(containerElement, element);
      }
    }

    return undefined;
  };

  return render;
}
```

getAppWrapperGetter 用于生成一个获得 elelment 的方法
```
function getAppWrapperGetter(
  appName: string,
  appInstanceId: string,
  useLegacyRender: boolean,
  strictStyleIsolation: boolean,
  elementGetter: () => HTMLElement | null,
) {
  return () => {
    if (useLegacyRender) {
      if (strictStyleIsolation) throw new Error('[qiankun]: strictStyleIsolation can not be used with legacy render!');

      const appWrapper = document.getElementById(getWrapperId(appInstanceId));
      assertElementExist(
        appWrapper,
        `[qiankun] Wrapper element for ${appName} with instance ${appInstanceId} is not existed!`,
      );
      return appWrapper!;
    }

    const element = elementGetter();
    assertElementExist(
      element,
      `[qiankun] Wrapper element for ${appName} with instance ${appInstanceId} is not existed!`,
    );

    // 如果是 strictStyleIsolation 模式，返回的是 element!.shadowRoot!
    // ! 表示匿名函数执行
    if (strictStyleIsolation) {
      return element!.shadowRoot!;
    }

    return element!;
  };
}
```

createSandboxContainer 是在 loadApp 的时候执行的。返回值中包含 mount 和 unmount 两个函数，分别在微应用 mount 和 unmount 生命周期执行。
```
export function createSandboxContainer(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  scopedCSS: boolean,
  useLooseSandbox?: boolean,
  excludeAssetFilter?: (url: string) => boolean,
  globalContext?: typeof window,
) {
  let sandbox: SandBox;
  // sandbox 创建方式不同。
  // ProxySandbox 本质是通过 Proxy 的方式创建了一个 fakeWindow 对象。
  // sandbox 的数据结构是
  //{
  //   name: string;
  //   proxy: WindowProxy;
  //   sandboxRunning = true;
  //   active() 
  //   inactive() 
  //}
  if (window.Proxy) {
    // LegacySandbox 基于 Proxy 实现的沙箱，为了兼容性 singular 模式下依旧使用该沙箱，等新沙箱稳定之后再切换
    // ProxySandbox 基于 Proxy 实现的沙箱
    sandbox = useLooseSandbox ? new LegacySandbox(appName, globalContext) : new ProxySandbox(appName, globalContext);
  } else {
    // SnapshotSandbox 基于 diff 方式实现的沙箱，用于不支持 Proxy 的低版本浏览器
    sandbox = new SnapshotSandbox(appName);
  }

  // some side effect could be be invoked while bootstrapping, such as dynamic stylesheet injection with style-loader, especially during the development phase
  const bootstrappingFreers = patchAtBootstrapping(appName, elementGetter, sandbox, scopedCSS, excludeAssetFilter);
  // mounting freers are one-off and should be re-init at every mounting time
  let mountingFreers: Freer[] = [];

  let sideEffectsRebuilders: Rebuilder[] = [];

  return {
    instance: sandbox,

    /**
     * 沙箱被 mount
     * 可能是从 bootstrap 状态进入的 mount
     * 也可能是从 unmount 之后再次唤醒进入 mount
     */
    async mount() {
      /* ------------------------------------------ 因为有上下文依赖（window），以下代码执行顺序不能变 ------------------------------------------ */

      /* ------------------------------------------ 1. 启动/恢复 沙箱------------------------------------------ */
      sandbox.active();

      const sideEffectsRebuildersAtBootstrapping = sideEffectsRebuilders.slice(0, bootstrappingFreers.length);
      const sideEffectsRebuildersAtMounting = sideEffectsRebuilders.slice(bootstrappingFreers.length);

      // must rebuild the side effects which added at bootstrapping firstly to recovery to nature state
      if (sideEffectsRebuildersAtBootstrapping.length) {
        sideEffectsRebuildersAtBootstrapping.forEach((rebuild) => rebuild());
      }

      /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
      // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
      mountingFreers = patchAtMounting(appName, elementGetter, sandbox, scopedCSS, excludeAssetFilter);

      /* ------------------------------------------ 3. 重置一些初始化时的副作用 ------------------------------------------*/
      // 存在 rebuilder 则表明有些副作用需要重建
      if (sideEffectsRebuildersAtMounting.length) {
        sideEffectsRebuildersAtMounting.forEach((rebuild) => rebuild());
      }

      // clean up rebuilders
      sideEffectsRebuilders = [];
    },

    /**
     * 恢复 global 状态，使其能回到应用加载之前的状态
     */
    async unmount() {
      // record the rebuilders of window side effects (event listeners or timers)
      // note that the frees of mounting phase are one-off as it will be re-init at next mounting
      sideEffectsRebuilders = [...bootstrappingFreers, ...mountingFreers].map((free) => free());

      sandbox.inactive();
    },
  };
}
```

getAddOns 为 windows 对象增加生命周期方法
```
import getRuntimePublicPathAddOn from './runtimePublicPath';

export default function getAddOns<T extends object>(global: Window, publicPath: string): FrameworkLifeCycles<T> {
  // global 上增加属性或方法
  return mergeWith({}, getRuntimePublicPathAddOn(global, publicPath), (v1, v2) => concat(v1 ?? [], v2 ?? []));
}

import { FrameworkLifeCycles } from '../interfaces';

const rawPublicPath = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ || '/';

export default function getAddOn(global: Window, publicPath = '/'): FrameworkLifeCycles<any> {
  let hasMountedOnce = false;

  // global 上增加生命周期方法
  // 这个生命周期方法在 global 对象上新增或者是删除 __INJECTED_PUBLIC_PATH_BY_QIANKUN__ 这个字段
  return {
    async beforeLoad() {
      // eslint-disable-next-line no-param-reassign
      global.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = publicPath;
    },

    async beforeMount() {
      if (hasMountedOnce) {
        // eslint-disable-next-line no-param-reassign
        global.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = publicPath;
      }
    },

    async beforeUnmount() {
      if (rawPublicPath === undefined) {
        // eslint-disable-next-line no-param-reassign
        delete global.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
      } else {
        // eslint-disable-next-line no-param-reassign
        global.__INJECTED_PUBLIC_PATH_BY_QIANKUN__ = rawPublicPath;
      }

      hasMountedOnce = true;
    },
  };
}
```

qiankun 的总体设计还是基于 single-spa。single-spa 中应用有 unload，unmount，bootstrap 和 mount 这四个生命周期，其中，unmount，bootstrap 和 mount 是必须存在的。对于一个微应用而言，一个完整的流程是，执行 loadApp 方法加载，执行 bootstrap，执行 mount，然后执行 unmount 和 unload 完成卸载。

qiankun 继承了 single spa 的生命周期，微应用必须对外暴露 bootstrap, mount, unmount 方法，这些生命周期方法会在 single-spa 同名生命周期执行，同时，qiankun 在注册微应用的时候，还可以定义 beforeLoad，beforeMount，afterMount，beforeUnmount，afterUnmount 这 5 个生命周期，由于这 5 个方法是所有微应用共享的，微应用的本身的业务逻辑不推荐写在这里，这些方法会被 qiankun 加强，用于标志微应用是否受控于主应用，除了 beforeLoad，剩下的 4 个生命周期会整合到 mount, unmount 中。
