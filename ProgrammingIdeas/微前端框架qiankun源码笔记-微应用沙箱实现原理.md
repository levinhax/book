## 微应用沙箱实现原理

qiankun 中沙箱的实现比较复杂，本章讲解 ProxySandbox 的实现方式。

createSandbox 是在 loadApp 的时候执行的。返回值中包含 mount 和 unmount 两个函数，分别在微应用 mount 和 unmount 生命周期执行。
```
export function createSandbox(appName: string, elementGetter: () => HTMLElement | ShadowRoot, singular: boolean) {
  // mounting freers are one-off and should be re-init at every mounting time
  let mountingFreers: Freer[] = [];

  let sideEffectsRebuilders: Rebuilder[] = [];

  let sandbox: SandBox;
  if (window.Proxy) {
    sandbox = singular ? new LegacySandbox(appName) : new ProxySandbox(appName);
  } else {
    sandbox = new SnapshotSandbox(appName);
  }

  // some side effect could be be invoked while bootstrapping, such as dynamic stylesheet injection with style-loader, especially during the development phase
  const bootstrappingFreers = patchAtBootstrapping(appName, elementGetter, sandbox.proxy, singular);

  return {
    proxy: sandbox.proxy,

    /**
     * 沙箱被 mount
     * 可能是从 bootstrap 状态进入的 mount
     * 也可能是从 unmount 之后再次唤醒进入 mount
     */
    async mount() {
      // bootstrappingFreers 的 length 是 1
      const sideEffectsRebuildersAtBootstrapping = sideEffectsRebuilders.slice(0, bootstrappingFreers.length);
      const sideEffectsRebuildersAtMounting = sideEffectsRebuilders.slice(bootstrappingFreers.length);

      // must rebuild the side effects which added at bootstrapping firstly to recovery to nature state
      if (sideEffectsRebuildersAtBootstrapping.length) {
        // 执行 rebuild
        sideEffectsRebuildersAtBootstrapping.forEach(rebuild => rebuild());
      }

      /* ------------------------------------------ 因为有上下文依赖（window），以下代码执行顺序不能变 ------------------------------------------ */

      /* ------------------------------------------ 1. 启动/恢复 沙箱------------------------------------------ */
      sandbox.active();

      /* ------------------------------------------ 2. 开启全局变量补丁 ------------------------------------------*/
      // render 沙箱启动时开始劫持各类全局监听，尽量不要在应用初始化阶段有 事件监听/定时器 等副作用
      mountingFreers = patchAtMounting(appName, elementGetter, sandbox.proxy, singular);

      /* ------------------------------------------ 3. 重置一些初始化时的副作用 ------------------------------------------*/
      // 存在 rebuilder 则表明有些副作用需要重建
      if (sideEffectsRebuildersAtMounting.length) {
        sideEffectsRebuildersAtMounting.forEach(rebuild => rebuild());
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

      // 执行 free 操作
      // sideEffectsRebuilders 赋值
      sideEffectsRebuilders = [...bootstrappingFreers, ...mountingFreers].map(free => free());

      sandbox.inactive();
    },
  };
}
```

qiankun 中沙箱的实现有三种。如果一个页面上都多个微前端应用，使用 ProxySandbox，否则使用 LegacySandbox。如果不支持 Proxy，使用 SnapshotSandbox。
```
if (window.Proxy) {
  sandbox = singular ? new LegacySandbox(appName) : new ProxySandbox(appName);
} else {
  sandbox = new SnapshotSandbox(appName);
}
```

ProxySandbox 是基于 Proxy 实现的沙箱。
```
export default class ProxySandbox implements SandBox {
  /** window 值变更记录 */
  private updatedValueSet = new Set<PropertyKey>();

  name: string;

  proxy: WindowProxy;

  sandboxRunning = true;

  // 激活方法
  // activeSandboxCount 是全局变量，表示当前激活的沙盒的数量
  active() {
    this.sandboxRunning = true;
    activeSandboxCount++;
  }

  // 关闭沙盒的方法
  inactive() {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[qiankun:sandbox] ${this.name} modified global properties restore...`, [
        ...this.updatedValueSet.keys(),
      ]);
    }

    clearSystemJsProps(this.proxy, --activeSandboxCount === 0);

    this.sandboxRunning = false;
  }

  constructor(name: string) {
    this.name = name;
    const { sandboxRunning, updatedValueSet } = this;

    const rawWindow = window;

    // 处理 window 中不可编辑或不可删除的属性
    const fakeWindow = createFakeWindow(rawWindow);

    // 定义 proxy 的 set get 等方法
    const proxy = new Proxy(fakeWindow, {
      set(target: FakeWindow, p: PropertyKey, value: any): boolean {
        if (sandboxRunning) {
          // @ts-ignore

          // 调用 set 方法的时候，除了对象上多一个属性，还会在 updatedValueSet 中保存一个 key
          target[p] = value;
          updatedValueSet.add(p);

          // 兼容 System.js 的做法，忽略
          interceptSystemJsProps(p, value);

          return true;
        }

        if (process.env.NODE_ENV === 'development') {
          console.warn(`[qiankun] Set window.${p.toString()} while sandbox destroyed or inactive in ${name}!`);
        }

        // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
        return true;
      },

      get(target: FakeWindow, p: PropertyKey): any {
        // avoid who using window.window or window.self to escape the sandbox environment to touch the really window
        // or use window.top to check if an iframe context

        // 使用 get 获得 top，window，self 的都会获得 proxy 本身
        if (
          p === 'top' ||
          p === 'window' ||
          p === 'self' ||
          (process.env.NODE_ENV === 'test' && (p === 'mockTop' || p === 'mockSafariTop'))
        ) {
          return proxy;
        }

        // never rewrite eval
        if (p === 'eval') {
          // eslint-disable-next-line no-eval
          return eval;
        }

        // proxy.hasOwnProperty would invoke getter firstly, then its value represented as rawWindow.hasOwnProperty

        // hasOwnProperty 同时判断 target(proxy) 和 rawWindow(window)
        if (p === 'hasOwnProperty') {
          return (key: PropertyKey) => target.hasOwnProperty(key) || rawWindow.hasOwnProperty(key);
        }

        // call proxy getter interceptors
        // 获得该属性的 getter 方法，如果存在直接执行
        const proxyPropertyGetter = getProxyPropertyGetter(proxy, p);
        if (proxyPropertyGetter) {
          return proxyPropertyGetter();
        }

        // value 先从 target 拿，拿不到，从 rawWindow 拿
        const value = (target as any)[p] || (rawWindow as any)[p];

        // 忽略，认为返回值是 value 就好了
        return getTargetValue(rawWindow, value);
      },

      has(target: FakeWindow, p: string | number | symbol): boolean {
        return p in target || p in rawWindow;
      },

      getOwnPropertyDescriptor(target: FakeWindow, p: string | number | symbol): PropertyDescriptor | undefined {
        if (target.hasOwnProperty(p)) {
          return Object.getOwnPropertyDescriptor(target, p);
        }

        if (rawWindow.hasOwnProperty(p)) {
          return Object.getOwnPropertyDescriptor(rawWindow, p);
        }

        return undefined;
      },

      // trap to support iterator with sandbox
      ownKeys(target: FakeWindow): PropertyKey[] {
        return uniq([...Reflect.ownKeys(rawWindow), ...Reflect.ownKeys(target)]);
      },

      deleteProperty(target: FakeWindow, p: string | number | symbol): boolean {
        // 肯定不会删除 window 上的，只会删除 proxy 上的
        if (target.hasOwnProperty(p)) {
          // @ts-ignore
          delete target[p];
          updatedValueSet.delete(p);

          return true;
        }

        return true;
      },
    });

    this.proxy = proxy;
  }
}
```

createFakeWindow 的入参是一个 window 对象，返回值是 window 对象的 proxy。
```
function createFakeWindow(global: Window): Window {
  const fakeWindow = {} as FakeWindow;

  // Object.getOwnPropertyNames()方法返回一个由指定对象的所有自身属性的属性名
  // 包括不可枚举属性但不包括Symbol值作为名称的属性组成的数组。
  Object.getOwnPropertyNames(global)
    // 找到 window 对象中不可改变或不可删除的属性
    .filter(p => {
      // Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。
      // 自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性
      const descriptor = Object.getOwnPropertyDescriptor(global, p);

      // configurable 当且仅当指定对象的属性描述可以被改变或者属性可被删除时，为true
      return !descriptor?.configurable;
    })
    .forEach(p => {
      const descriptor = Object.getOwnPropertyDescriptor(global, p);
      if (descriptor) {

        // 这些属性中找到 top self window 属性，将其配置为 configurable
        if (
          p === 'top' ||
          p === 'self' ||
          p === 'window' ||
          (process.env.NODE_ENV === 'test' && (p === 'mockTop' || p === 'mockSafariTop'))
        ) {
          descriptor.configurable = true;
          /*
           The descriptor of window.window/window.top/window.self in Safari/FF are accessor descriptors, we need to avoid adding a data descriptor while it was
           Example:
            Safari/FF: Object.getOwnPropertyDescriptor(window, 'top') -> {get: function, set: undefined, enumerable: true, configurable: false}
            Chrome: Object.getOwnPropertyDescriptor(window, 'top') -> {value: Window, writable: false, enumerable: true, configurable: false}
           */

          // 如果 descriptor 有 get 方法，将 descriptor 设置为 writable
          if (!Object.prototype.hasOwnProperty.call(descriptor, 'get')) {
            descriptor.writable = true;
          }
        }

        // freeze the descriptor to avoid being modified by zone.js
        // const rawObjectDefineProperty = Object.defineProperty;
        // fakeWindow 中放置这些属性
        rawObjectDefineProperty(fakeWindow, p, Object.freeze(descriptor!));
      }
    });

  return fakeWindow;
}
```

proxyGetterMap 的 key 是 WindowProxy，value 是个对象，对象的 key 表示 WindowProxy 属性名称，value 是这个属性的 get 方法。
```
const proxyGetterMap = new Map<WindowProxy, Record<PropertyKey, any>>();

export function getProxyPropertyGetter(proxy: WindowProxy, property: PropertyKey) {
  const getters = proxyGetterMap.get(proxy) || ({} as Record<string, any>);
  return getters[property as string];
}

export function setProxyPropertyGetter(proxy: WindowProxy, property: PropertyKey, getter: () => any) {
  const prevGetters = proxyGetterMap.get(proxy) || {};
  proxyGetterMap.set(proxy, { ...prevGetters, [property]: getter });
}
```

sandbox 新建好之后，执行 patchAtBootstrapping 方法，该方法会对 document.createElement，HTML DOM appendChild，HTML DOM removeChild，HTML DOM insertBefore 做处理，以便 style 和 script 能顺利的挂载到微应用下面。
```
import patchDynamicAppend from './dynamicHeadAppend';

export function patchAtBootstrapping(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  proxy: Window,
  singular: boolean,
): Freer[] {
  return [patchDynamicAppend(appName, elementGetter, proxy, false, singular)];
}
```

patch 就是 patchDynamicAppend。
```
export default function patch(
  appName: string,
  appWrapperGetter: () => HTMLElement | ShadowRoot,
  proxy: Window,
  mounting = true,
  singular = true,
): Freer {
  // 动态样式表
  let dynamicStyleSheetElements: Array<HTMLLinkElement | HTMLStyleElement> = [];

  // 多个微应用的时候，重写 proxy 获得的 document
  // 通过这个 document 创建的 style 或是 script，在属性 Symbol(attach-proxy-qiankun) 上能拿到 appName, proxy, appWrapperGetter, dynamicStyleSheetElements
  if (!singular) {
    // proxyGetterMap 中存入从 proxy 获得 document 的方法
    setProxyPropertyGetter(proxy, 'document', () => {

      // 获得的 document 也是一个 Proxy
      return new Proxy(document, {
        get(target: Document, property: PropertyKey): any {

          // 重写 createElement 方法
          if (property === 'createElement') {
            return function createElement(tagName: string, options?: any) {
              const element = document.createElement(tagName, options);

              // 对于 style 或者 script
              if (tagName?.toLowerCase() === 'style' || tagName?.toLowerCase() === 'script') {

                // const attachProxySymbol = 'Symbol(attach-proxy-qiankun)';
                // element 上增加一个属性 Symbol(attach-proxy-qiankun)，通过这个属性可以获得 appName, proxy, appWrapperGetter, dynamicStyleSheetElements
                Object.defineProperty(element, attachProxySymbol, {
                  value: { appName, proxy, appWrapperGetter, dynamicStyleSheetElements },
                  enumerable: false,
                });
              }

              return element;
            };
          }

          // <any>target)[property]
          return getTargetValue(document, (<any>target)[property]);
        },

        // set 方法没变，应该不会有人在 document 上 set 值吧
        set(target: Document, p: PropertyKey, value: any): boolean {
          // eslint-disable-next-line no-param-reassign
          (<any>target)[p] = value;
          return true;
        },
      });
    });
  }

  // Just overwrite it while it have not been overwrite
  if (HTMLHeadElement.prototype.appendChild === rawHeadAppendChild) {
    // 覆盖 appendChild 方法
    HTMLHeadElement.prototype.appendChild = getNewAppendChild(
      appName,
      appWrapperGetter,
      proxy,
      singular,
      dynamicStyleSheetElements,
    );
  }

  // Just overwrite it while it have not been overwrite
  if (HTMLHeadElement.prototype.removeChild === rawHeadRemoveChild) {
    // 覆盖 removeChild 方法
    HTMLHeadElement.prototype.removeChild = getNewRemoveChild(appWrapperGetter);
  }

  // `emotion` a css-in-js library insert a style tag use insertBefore, so we also rewrite it like appendChild
  // see https://github.com/umijs/qiankun/issues/420
  if (HTMLHeadElement.prototype.insertBefore === rawHeadInsertBefore) {
    // 覆盖 insertBefore 方法
    HTMLHeadElement.prototype.insertBefore = getNewInsertBefore(
      appName,
      appWrapperGetter,
      singular,
      dynamicStyleSheetElements,
    );
  }

  patchCount++;

  // 该方法在 sandbox unmount 的时候执行
  // unmount 的时候将 dynamicStyleSheetElements 存起来
  return function free() {
    patchCount--;

    // release the overwrite prototype after all the micro apps unmounted
    if (patchCount === 0) {
      HTMLHeadElement.prototype.appendChild = rawHeadAppendChild;
      HTMLHeadElement.prototype.insertBefore = rawHeadInsertBefore;
      HTMLHeadElement.prototype.removeChild = rawHeadRemoveChild;
    }

    dynamicStyleSheetElements.forEach(stylesheetElement => {
      /*
         With a styled-components generated style element, we need to record its cssRules for restore next re-mounting time.
         We're doing this because the sheet of style element is going to be cleaned automatically by browser after the style element dom removed from document.
         see https://www.w3.org/TR/cssom-1/#associated-css-style-sheet
         */
      if (stylesheetElement instanceof HTMLStyleElement && isStyledComponentsLike(stylesheetElement)) {
        if (stylesheetElement.sheet) {
          // record the original css rules of the style element for restore
          setCachedRules(stylesheetElement, (stylesheetElement.sheet as CSSStyleSheet).cssRules);
        }
      }

      // As now the sub app content all wrapped with a special id container,
      // the dynamic style sheet would be removed automatically while unmoutting
    });

    // 该方法在 mount 的时候执行
    return function rebuild() {
      dynamicStyleSheetElements.forEach(stylesheetElement => {
        // re-append the dynamic stylesheet to sub-app container
        // Using document.head.appendChild ensures that appendChild calls
        // can also directly use the HTMLHeadElement.prototype.appendChild method which is overwritten at mounting phase
        // 样式重新挂载到子应用下
        document.head.appendChild.call(appWrapperGetter(), stylesheetElement);

        /*
        get the stored css rules from styled-components generated element, and the re-insert rules for them.
        note that we must do this after style element had been added to document, which stylesheet would be associated to the document automatically.
        check the spec https://www.w3.org/TR/cssom-1/#associated-css-style-sheet
         */
        if (stylesheetElement instanceof HTMLStyleElement && isStyledComponentsLike(stylesheetElement)) {
          const cssRules = getCachedRules(stylesheetElement);
          if (cssRules) {
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < cssRules.length; i++) {
              const cssRule = cssRules[i];
              (stylesheetElement.sheet as CSSStyleSheet).insertRule(cssRule.cssText);
            }
          }
        }
      });

      // As the hijacker will be invoked every mounting phase, we could release the cache for gc after rebuilding
      if (mounting) {
        dynamicStyleSheetElements = [];
      }
    };
  };
}
```

appendChild 方法变成了 getNewAppendChild 方法，主要作用是修改了 style 和 script 的处理方式。对于 style 的话，将样式放在微应用下，对于 script 的话，qiankun 完全劫持了 script 的处理过程，这样可以把 script 执行后 export 的内容挂载到 proxy 上，并且模拟了 script 的 onload 方法。
```
function getNewAppendChild(...args: any[]) {
  return function appendChild<T extends Node>(this: HTMLHeadElement, newChild: T) {
    const element = newChild as any;
    if (element.tagName) {
      // eslint-disable-next-line prefer-const
      // 解构入参
      let [appName, appWrapperGetter, proxy, singular, dynamicStyleSheetElements] = args;

      // 如果是 style 或是 script，自带 singular，appWrapperGetter，dynamicStyleSheetElements，proxy
      const storedContainerInfo = element[attachProxySymbol];
      if (storedContainerInfo) {
        // eslint-disable-next-line prefer-destructuring
        singular = storedContainerInfo.singular;
        // eslint-disable-next-line prefer-destructuring
        appWrapperGetter = storedContainerInfo.appWrapperGetter;
        // eslint-disable-next-line prefer-destructuring
        dynamicStyleSheetElements = storedContainerInfo.dynamicStyleSheetElements;
        // eslint-disable-next-line prefer-destructuring
        proxy = storedContainerInfo.proxy;
      }

      // have storedContainerInfo means it invoked by a micro app
      // 是微应用，且不是 singular 模式
      const invokedByMicroApp = storedContainerInfo && !singular;

      switch (element.tagName) {
        case LINK_TAG_NAME:

        // 对样式文件的处理方式
        case STYLE_TAG_NAME: {
          const stylesheetElement: HTMLLinkElement | HTMLStyleElement = newChild as any;

          // 如果是 style，将 style 加入 dynamicStyleSheetElements
          if (invokedByMicroApp) {
            // eslint-disable-next-line no-shadow
            dynamicStyleSheetElements.push(stylesheetElement);
            // const rawAppendChild = HTMLElement.prototype.appendChild;
            // appendChild 是基于 appWrapper 做的
            // 也就是样式文件会放在微应用下
            return rawAppendChild.call(appWrapperGetter(), stylesheetElement) as T;
          }

          // check if the currently specified application is active
          // While we switch page from qiankun app to a normal react routing page, the normal one may load stylesheet dynamically while page rendering,
          // but the url change listener must to wait until the current call stack is flushed.
          // This scenario may cause we record the stylesheet from react routing page dynamic injection,
          // and remove them after the url change triggered and qiankun app is unmouting
          // see https://github.com/ReactTraining/history/blob/master/modules/createHashHistory.js#L222-L230

          // 当前应用是否 active
          const activated = checkActivityFunctions(window.location).some(name => name === appName);
          // only hijack dynamic style injection when app activated

          // active 时候将样式表放入指定微应用下，否则放在主应用的 head 下
          if (activated) {
            dynamicStyleSheetElements.push(stylesheetElement);

            return rawAppendChild.call(appWrapperGetter(), stylesheetElement) as T;
          }

          // const rawHeadAppendChild = HTMLHeadElement.prototype.appendChild;
          return rawHeadAppendChild.call(this, element) as T;
        }

        // script 文件处理方式
        case SCRIPT_TAG_NAME: {
          // 不是由微应用管理的，该怎么调用就怎么调用
          if (!invokedByMicroApp) {
            return rawAppendChild.call(this, element) as T;
          }

          // 如果是微应用管理的
          const { src, text } = element as HTMLScriptElement;

          const { fetch } = frameworkConfiguration;

          // 根据 src 加载 script，export 的 js 挂载到 proxy 上
          // 发出 load 事件
          if (src) {
            execScripts(null, [src], proxy, { fetch, strictGlobal: !singular }).then(
              () => {
                // we need to invoke the onload event manually to notify the event listener that the script was completed
                // here are the two typical ways of dynamic script loading
                // 1. element.onload callback way, which webpack and loadjs used, see https://github.com/muicss/loadjs/blob/master/src/loadjs.js#L138
                // 2. addEventListener way, which toast-loader used, see https://github.com/pyrsmk/toast/blob/master/src/Toast.ts#L64
                const loadEvent = new CustomEvent('load');
                if (isFunction(element.onload)) {
                  element.onload(loadEvent);
                } else {
                  element.dispatchEvent(loadEvent);
                }
              },
              () => {
                const errorEvent = new CustomEvent('error');
                if (isFunction(element.onerror)) {
                  element.onerror(errorEvent);
                } else {
                  element.dispatchEvent(errorEvent);
                }
              },
            );

            // 表明 script 被 qiankun 劫持了
            const dynamicScriptCommentElement = document.createComment(`dynamic script ${src} replaced by qiankun`);
            return rawAppendChild.call(appWrapperGetter(), dynamicScriptCommentElement) as T;
          }

          // 如果没有 src，直接执行，挂载到 proxy 上
          execScripts(null, [`<script>${text}</script>`], proxy, { strictGlobal: !singular }).then(
            element.onload,
            element.onerror,
          );
          const dynamicInlineScriptCommentElement = document.createComment('dynamic inline script replaced by qiankun');
          return rawAppendChild.call(appWrapperGetter(), dynamicInlineScriptCommentElement) as T;
        }

        default:
          break;
      }
    }

    return rawHeadAppendChild.call(this, element) as T;
  };
}
```

removeChild 方法替代为 getNewRemoveChild，该方法首先从微应用删除节点，如果微应用不存在这个节点，就从主应用删除。
```
function getNewRemoveChild(...args: any[]) {
  return function removeChild<T extends Node>(this: HTMLHeadElement, child: T) {
    let [appWrapperGetter] = args;

    const storedContainerInfo = (child as any)[attachProxySymbol];
    if (storedContainerInfo) {
      // eslint-disable-next-line prefer-destructuring
      appWrapperGetter = storedContainerInfo.appWrapperGetter;
    }

    try {
      // container may had been removed while app unmounting if the removeChild action was async
      const container = appWrapperGetter();
      if (container.contains(child)) {
        return rawRemoveChild.call(container, child) as T;
      }
    } catch (e) {
      console.warn(e);
    }

    return rawHeadRemoveChild.call(this, child) as T;
  };
}
```

patchAtMounting 是在 mounting 阶段执行的劫持。
```
export function patchAtMounting(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  proxy: Window,
  singular: boolean,
): Freer[] {
  return [
    // window.setInterval
    patchInterval(),
    // window.addEventListener
    patchWindowListener(),
    // fix umi bug
    patchHistoryListener(),
    patchDynamicAppend(appName, elementGetter, proxy, true, singular),
    // mouseEnvent
    patchUIEvent(proxy),
  ];
}
```

patchInterval 比较简单，就是对 window.setInterval 和 window.clearInterval 进行劫持，将 intervalId 存储在 intervals 中。
```
const rawWindowInterval = window.setInterval;
const rawWindowClearInterval = window.clearInterval;

export default function patch() {
  let intervals: number[] = [];

  // @ts-ignore
  window.clearInterval = (intervalId: number) => {
    intervals = intervals.filter(id => id !== intervalId);
    return rawWindowClearInterval(intervalId);
  };

  // @ts-ignore
  window.setInterval = (handler: Function, timeout?: number, ...args: any[]) => {
    const intervalId = rawWindowInterval(handler, timeout, ...args);
    intervals = [...intervals, intervalId];
    return intervalId;
  };

  return function free() {
    intervals.forEach(id => window.clearInterval(id));
    window.setInterval = rawWindowInterval;
    window.clearInterval = rawWindowClearInterval;

    return noop;
  };
}
```

patchWindowListener 也是劫持 window.addEventListener 和 window.removeEventListener 方法，用一个 listenerMap 来存储 listener。
```
const rawAddEventListener = window.addEventListener;
const rawRemoveEventListener = window.removeEventListener;

export default function patch() {
  const listenerMap = new Map<string, EventListenerOrEventListenerObject[]>();

  window.addEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    const listeners = listenerMap.get(type) || [];
    listenerMap.set(type, [...listeners, listener]);
    return rawAddEventListener.call(window, type, listener, options);
  };

  window.removeEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    const storedTypeListeners = listenerMap.get(type);
    if (storedTypeListeners && storedTypeListeners.length && storedTypeListeners.indexOf(listener) !== -1) {
      storedTypeListeners.splice(storedTypeListeners.indexOf(listener), 1);
    }
    return rawRemoveEventListener.call(window, type, listener, options);
  };

  return function free() {
    listenerMap.forEach((listeners, type) =>
      [...listeners].forEach(listener => window.removeEventListener(type, listener)),
    );
    window.addEventListener = rawAddEventListener;
    window.removeEventListener = rawRemoveEventListener;

    return noop;
  };
}
```

沙箱的实现比较繁琐，首先在初始化阶段，使用 Proxy 生成一个 window 对象的代理，将 windows 上不可改变或不可删除的属性的 configurable 设置为 true，放到代理对象中。然后重写 document.createElement，appendChild，removeChild，insertBefore 方法，改写了 style 和 script 的加载方式，以便 style 和 script 能顺利的挂载到微应用下面。

沙箱初始化完毕后，对外暴露 mount 和 unmount 方法，用于在微应用的同名生命周期中调用。mount 方法修改一些会产生副作用的全局函数，比如 window.setInterval 产生的定时任务，或者是 window.addEventListener 产生的监听，同一个微应用的这些副作用会存储在一些，这样在 unmount 阶段的时候就很容易根据应用进行清理。mount 方法也会对 script 和 style 劫持，和初始化过程基本一致，mount 方法会有一些跟别的框架相关的逻辑，比如 umi，原因是使用 umi 框架会对全局造成影响，qiankun 需要屏蔽这部分变化导致的 bug。 unmount 阶段没什么，就是对 mount 阶段副作用的清理。
