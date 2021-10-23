## 应用注册registerMicroApps

registerMicroApps 方法用于注册微应用。参数分为两类，第一类是微应用的一些注册信息，第二类是全局的微应用生命周期钩子（可选）

qiankun/src/apis.ts
```
import { mountRootParcel, registerApplication, start as startSingleSpa } from 'single-spa';

let microApps: Array<RegistrableApp<Record<string, unknown>>> = [];

export function registerMicroApps<T extends ObjectType>(
  apps: Array<RegistrableApp<T>>,
  lifeCycles?: FrameworkLifeCycles<T>,
) {
  // Each app only needs to be registered once
  // microApps 是所有已经注册过的应用信息
  // 过滤得到未注册的应用信息
  const unregisteredApps = apps.filter((app) => !microApps.some((registeredApp) => registeredApp.name === app.name));

  microApps = [...microApps, ...unregisteredApps];

  unregisteredApps.forEach((app) => {
    // name 是应用唯一标识
    // activeRule 代表微应用的激活规则
    // loader 页面 loading 组件
    // props 是应用级别传参
    // appConfig 除了上述的四个参数都属于 appConfig
    const { name, activeRule, loader = noop, props, ...appConfig } = app;

    // registerApplication 方法来自于 single-spa
    registerApplication({
      name,
      app: async () => {
        // 设置 loading
        loader(true);
        await frameworkStartedDefer.promise;

        // 获得 app 的配置
        const { mount, ...otherMicroAppConfigs } = (
          await loadApp({ name, props, ...appConfig }, frameworkConfiguration, lifeCycles)
        )();

        // mount 方法前后设置 loader
        return {
          mount: [async () => loader(true), ...toArray(mount), async () => loader(false)],
          ...otherMicroAppConfigs,
        };
      },
      activeWhen: activeRule,
      customProps: props,
    });
  });
}
```

registerApplication 方法中，single-spa 维护了一个全局变量 app，存放的就是注册的微应用。registerApplication 主要就是规范应用的配置，然后将根据配置生成一个 app 对象，加入 apps 中。

registerApplication 总体来说做了三件事，一是参数的规范化处理，二是将 app 配置信息放到全局数组中维护，三是触发 reroute 操作。

*reroute 是 single-spa 的核心，负责应用的事件生命周期管理*

```
const apps = [];

export function registerApplication(
  // 应用名称，或者是配置对象
  appNameOrConfig,
  // 加载应用函数
  appOrLoadApp,
  // 微应用的激活规则
  activeWhen,
  // 其它参数
  customProps
) {

  // registration 做规范化处理
  const registration = sanitizeArguments(
    appNameOrConfig,
    appOrLoadApp,
    activeWhen,
    customProps
  );

  // 如果有重复注册的应用，报错
  if (getAppNames().indexOf(registration.name) !== -1)
    throw Error(
      formatErrorMessage(
        21,
        __DEV__ &&
          `There is already an app registered with name ${registration.name}`,
        registration.name
      )
    );

  // 应用信息放到 apps 数组中。
  apps.push(
    assign(
      {
        loadErrorTime: null,
        // 默认状态是 NOT_LOADED ，表示应用未加载
        status: NOT_LOADED,
        parcels: {},
        devtools: {
          overlays: {
            options: {},
            selectors: [],
          },
        },
      },
      registration
    )
  );

  // export const isInBrowser = typeof window !== "undefined";
  // 当前是浏览器环境
  if (isInBrowser) {
    // 确保 jquery 的支持 
    ensureJQuerySupport();

    // 重新触发路由，后续详细讲解
    reroute();
  }
}
```

sanitizeArguments 规范化参数，为什么要规范化参数，原因在于 registerApplication 的入参的灵活性，该方法最终目的是获得一个 registration 对象。

1. loadApp 必须是一个函数，如果不是，转换成 Promise 函数。
2. activeWhen 的处理比较复杂，原理是将字符串装换为正则表达式，activeWhen 支持一个数组。最终会将 activeWhen 也转换成一个函数。
3. customProps 比较简单了。没有就返回一个空对象。

