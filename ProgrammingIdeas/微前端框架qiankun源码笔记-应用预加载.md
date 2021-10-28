## 应用预加载

微应用注册完成后，需要使用 setDefaultMountApp 方法设置默认加载应用，然后调用 start 方法启动微应用。

setDefaultMountApp 设置默认加载的应用。实现的方式是监听 single-spa:no-app-change 事件

start 启动应用的时候默认会开启资源预加载，预加载简单的来说就是在 requestIdleCallback 回调函数中使用 import-html-entry 加载应用资源。这些资源会被缓存起来（根据 url 缓存），并不会执行。

qiankun/src/effects.ts
```
import { getMountedApps, navigateToUrl } from 'single-spa';

const firstMountLogLabel = '[qiankun] first app mounted';
if (process.env.NODE_ENV === 'development') {
  console.time(firstMountLogLabel);
}

export function setDefaultMountApp(defaultAppLink: string) {
  // can not use addEventListener once option for ie support

  // 增加全局事件监听 no-app-change
  window.addEventListener('single-spa:no-app-change', function listener() {
    // getMountedApps 获得当前已经 mounted 的应用
    const mountedApps = getMountedApps();
    if (!mountedApps.length) {
      // 如果一个 mounted 应用都没有，跳转到默认页面
      navigateToUrl(defaultAppLink);
    }

    // 这个事件监听一次，监听一次后就 remove 掉
    window.removeEventListener('single-spa:no-app-change', listener);
  });
}
```

start 启动应用

1. prefetch 可选，是否开启预加载，默认为 true。配置为 true 则会在第一个微应用 mount 完成后开始预加载其他微应用的静态资源，配置为 'all' 则主应用 start 后即开始预加载所有微应用静态资源。配置为 string[] 则会在第一个微应用 mounted 后开始加载数组内的微应用资源。配置为 function 则可完全自定义应用的资源加载时机 (首屏应用及次屏应用)。
2. sandbox - boolean | { strictStyleIsolation?: boolean } - 可选，是否开启沙箱，默认为 true。当配置为 { strictStyleIsolation: true } 表示开启严格的样式隔离模式。这种模式下 qiankun 会为每个微应用的容器包裹上一个 shadow dom 节点，从而确保微应用的样式不会对全局造成影响。
3. singular，是否为单实例场景，默认为 true。

src/apis.ts
```
export let frameworkConfiguration: FrameworkConfiguration = {};

export function start(opts: FrameworkConfiguration = {}) {
  // prefetch 默认 true
  frameworkConfiguration = { prefetch: true, singular: true, sandbox: true, ...opts };
  const { prefetch, sandbox, singular, urlRerouteOnly, ...importEntryOpts } = frameworkConfiguration;

  // 预加载
  if (prefetch) {
    // importEntryOpts 是预加载配置
    // microApps 是所有注册的 子应用
    doPrefetchStrategy(microApps, prefetch, importEntryOpts);
  }

  if (sandbox) {
    if (!window.Proxy) {
      console.warn('[qiankun] Miss window.Proxy, proxySandbox will degenerate into snapshotSandbox');
      // 快照沙箱不支持非 singular 模式
      if (!singular) {
        console.error('[qiankun] singular is forced to be true when sandbox enable but proxySandbox unavailable');
        frameworkConfiguration.singular = true;
      }
    }
  }

  // 调用 aingle spa start 事件
  startSingleSpa({ urlRerouteOnly });

  frameworkStartedDefer.resolve();
}
```