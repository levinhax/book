## 生命周期

reroute 是 single-spa 的核心方法。该方法更新微应用的状态，触发微应用的生命周期函数，并发出一系列自定义事件。

在进行微应用注册和调用 start 方法的时候，会触发 reroute。这些都是手动触发的方式，还有还有一个很关键的时候，那就是路由发生变化的时候，会自动进行 reroute。

single-spa 有个很重要的功能就是需要进行应用级别的路由，主应用在加载的时候会监听 hashchange 和 popstate 事件，然后会重写 window.addEventListener 方法，这样子应用如果要监听 hashchange 和 popstate 事件，就会调用到重写后的 addEventListener 方法，会将事件委托给主应用管理，变相的实现了 hashchange 和 popstate 事件的劫持。

由于 pushState 和 replaceState 方法比较特殊，不会触发上述两个事件，所以主应用中也对这两个方法进行了重写，使得这两个方法也能触发主应用的 reroute 方法。

single-spa/src/navigation/navigation-events.js
```
export const routingEventsListeningTo = ["hashchange", "popstate"];

// capturedEventListeners 中存放的就是微应用中事件监听的回调函数。
const capturedEventListeners = {
  hashchange: [],
  popstate: [],
};

if (isInBrowser) {
  // We will trigger an app change for any routing events.
  // urlReroute 就是 reroute 方法的带参数版本
  window.addEventListener("hashchange", urlReroute);
  window.addEventListener("popstate", urlReroute);

  // Monkeypatch addEventListener so that we can ensure correct timing
  // 这里要重写 window.addEventListener 和 window.removeEventListener 方法
  // 重写之前需要把原先的事件做个备份

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  window.addEventListener = function (eventName, fn) {
    if (typeof fn === "function") {
      if (
        // 如果用户监听的是 hashchange 和 popstate 事件，并且这个监听器此前未加入事件监听列表
        // 那这个事件时有可能引发应用变更的，需要加入 capturedEventListeners 中
        // 直接 return 掉，说明 hashchange 和 popstate 事件并没有马上执行
        // 而是在执行完 reroute 逻辑之后在执行
        routingEventsListeningTo.indexOf(eventName) >= 0 &&
        !find(capturedEventListeners[eventName], (listener) => listener === fn)
      ) {
        // 将这个回调加入 capturedEventListeners 中
        capturedEventListeners[eventName].push(fn);
        return;
      }
    }

    // 原生的监听事件
    return originalAddEventListener.apply(this, arguments);
  };


  window.removeEventListener = function (eventName, listenerFn) {
    if (typeof listenerFn === "function") {
      if (routingEventsListeningTo.indexOf(eventName) >= 0) {
        // capturedEventListeners 去除 listenerFn
        capturedEventListeners[eventName] = capturedEventListeners[
          eventName
        ].filter((fn) => fn !== listenerFn);
        return;
      }
    }

    return originalRemoveEventListener.apply(this, arguments);
  };

  // 加强 pushState 方法，使其能触发 popstate 事件
  window.history.pushState = patchedUpdateState(
    window.history.pushState,
    "pushState"
  );
  window.history.replaceState = patchedUpdateState(
    window.history.replaceState,
    "replaceState"
  );

  /* For convenience in `onclick` attributes, we expose a global function for navigating to
   * whatever an <a> tag's href is.
   */
  window.singleSpaNavigate = navigateToUrl;
}
```

urlReroute 就是调用 reroute。
```
function urlReroute() {
  reroute([], arguments);
}
```

patchedUpdateState 是对原生的 window.history.pushState 和 window.history.replaceState 做加强。让这两个事件也能被监听到。
```
function patchedUpdateState(updateState, methodName) {
  return function () {
    const urlBefore = window.location.href;
    const result = updateState.apply(this, arguments);
    const urlAfter = window.location.href;

    if (!urlRerouteOnly || urlBefore !== urlAfter) {
      // 调用了 urlReroute
      urlReroute(createPopStateEvent(window.history.state, methodName));
    }

    return result;
  };
}
```

发生 window.history.pushState 和 window.history.replaceState 事件后，new 一个 popstate 事件对象，传给 urlReroute 函数，模仿了 popstate 事件，这样就能触发相应的监听函数。
```
function createPopStateEvent(state, originalMethodName) {
  // https://github.com/single-spa/single-spa/issues/224 and https://github.com/single-spa/single-spa-angular/issues/49
  // We need a popstate event even though the browser doesn't do one by default when you call replaceState, so that
  // all the applications can reroute. We explicitly identify this extraneous event by setting singleSpa=true and
  // singleSpaTrigger=<pushState|replaceState> on the event instance.
  let evt;
  try {
    evt = new PopStateEvent("popstate", { state });
  } catch (err) {
    // IE 11 compatibility https://github.com/single-spa/single-spa/issues/299
    // https://docs.microsoft.com/en-us/openspecs/ie_standards/ms-html5e/bd560f47-b349-4d2c-baa8-f1560fb489dd
    evt = document.createEvent("PopStateEvent");
    evt.initPopStateEvent("popstate", false, false, state);
  }
  evt.singleSpa = true;
  evt.singleSpaTrigger = originalMethodName;
  return evt;
}
```

eroute 就是 single-spa 中核心方法。为了理解这个方法，我们需要了解 single-spa 是如何设计应用的生命周期的。

除去一些错误处理的状态外，single-spa 主要将应用分成四个阶段，分别是 NOT_LOADED，NOT_BOOTSTRAPPED，NOT_MOUNTED，MOUNTED。

- NOT_LOADED 是初始状态，表示微应用的资源未加载。
- NOT_BOOTSTRAPPED 表示未初始化，该状态是 NOT_LOADED 的下一个状态。
- NOT_MOUNTED 表示微应用相关代码未执行，是 NOT_BOOTSTRAPPED 的下一个状态。
- MOUNTED 表示微应用已经显示到界面上。

这四个状态可以相互装换，比如 NOT_BOOTSTRAPPED 状态的 app 可以装换为 NOT_MOUNTED，装换过程中也有状态，叫做 BOOTSTRAPPING。
```
export function reroute(pendingPromises = [], eventArguments) {
  // appChangeUnderway 初始值为 false，开始执行后变为 true
  if (appChangeUnderway) {
    // peopleWaitingOnAppChange 存放的是 reroute 开始执行后的路由变化
    // 暂时存储起来，本次 reroute 执行完毕后再处理
    return new Promise((resolve, reject) => {
      peopleWaitingOnAppChange.push({
        resolve,
        reject,
        eventArguments,
      });
    });
  }

  // 根据 apps 中每个 app 的 status 字段，分出四类
  const {
    appsToUnload,
    appsToUnmount,
    appsToLoad,
    appsToMount,
  } = getAppChanges();
  let appsThatChanged;

  if (isStarted()) {
    // appChangeUnderway 变为 true
    appChangeUnderway = true;

    // appsThatChanged 就是状态发生变化的 app
    appsThatChanged = appsToUnload.concat(
      appsToLoad,
      appsToUnmount,
      appsToMount
    );

    // 将变动的 app 调用生命周期函数
    return performAppChanges();
  } else {
    appsThatChanged = appsToLoad;
    return loadApps();
  }

  // 以下省略一些方法，用到的话会在后续讲到
  ...

}
```

getAppChanges 方法就是根据当前 url 找出状态需要改变的 app。并将其分为四类。这么做是为了后续调用相关的生命周期的时候方便些。

- appsToUnload：针对处在 NOT_BOOTSTRAPPED 和 NOT_MOUNTED 阶段的应用，如果和当前 url 不匹配，则放入 appsToUnload 中。
- appsToUnmount：针对 MOUNTED 阶段的应用，如果和当前 url 不匹配，则放入 appsToUnmount 中。
- appsToLoad：针对 NOT_LOADED 阶段的应用，如果和当前 url 匹配，则放入 appsToLoad 中。
- appsToMount：针对处在 NOT_BOOTSTRAPPED 和 NOT_MOUNTED 阶段的应用，如果和当前 url 匹配，则放入 appsToMount 中

```
export function getAppChanges() {
  const appsToUnload = [],
    appsToUnmount = [],
    appsToLoad = [],
    appsToMount = [];

  // We re-attempt to download applications in LOAD_ERROR after a timeout of 200 milliseconds
  const currentTime = new Date().getTime();

  // apps 存储了注册的应用
  // apps 的 status 注册的初值是 NOT_LOADED,
  apps.forEach((app) => {
    // appShouldBeActive 表示应用和当前路径匹配，应当加载
    const appShouldBeActive =
      app.status !== SKIP_BECAUSE_BROKEN && shouldBeActive(app);

    switch (app.status) {
      // LOAD_ERROR 但是时间没有超过 200 ms，放入 appsToLoad 数组中，准备重试
      case LOAD_ERROR:
        if (currentTime - app.loadErrorTime >= 200) {
          appsToLoad.push(app);
        }
        break;
      // 未加载但是根据路径判断应当激活，放入 appsToLoad 数组
      case NOT_LOADED:
        if (appShouldBeActive) {
          appsToLoad.push(app);
        }
        break;
      case NOT_BOOTSTRAPPED:
      case NOT_MOUNTED:
        // appsToUnload
        if (!appShouldBeActive && getAppUnloadInfo(toName(app))) {
          appsToUnload.push(app);
        } else if (appShouldBeActive) {
          // 等待 mount
          appsToMount.push(app);
        }
        break;
      // 已经加载的，但是当前路径变了，放入 appsToUnmount 数组
      case MOUNTED:
        if (!appShouldBeActive) {
          appsToUnmount.push(app);
        }
        break;
      // all other statuses are ignored
    }
  });

  return { appsToUnload, appsToUnmount, appsToLoad, appsToMount };
}
```

shouldBeActive 函数判断 app 是否应当激活，判断的原则是根据 activeWhen 方法进行匹配，activeWhen 方法的生成过程之前讲过。
```
export function shouldBeActive(app) {
  try {
    return app.activeWhen(window.location);
  } catch (err) {
    handleAppError(err, app, SKIP_BECAUSE_BROKEN);
    return false;
  }
}
```

performAppChanges 是真正触发事件和生命周期函数的地方。single-spa 中微应用可以提供的生命周期函数有这个几个。

- unload：appsToUnload 中的应用状态变成 NOT_LOADED 前，执行该应用的 unload 方法。
- unmount：appsToUnmount 中的应用状态变成 NOT_MOUNTED 前，执行该应用的 unmount 方法。
- bootstrap 和 mount 是 appsToLoad 中的 app 在执行完 loadApp 后，会接着调用 bootstrap 和 mount，还有 appsToMount 中的也会执行 bootstrap 和 mount，由于 appsToMount 中有部分应用是已经执行过 bootstrap 但是没有执行 mount 的，不会重复执行，因为每个方法在执行前是会判断 app 状态的。

appsToLoad 中的 app 不执行生命周期函数，原因在于此时微应用还没有加载，根本读不到任何生命周期方法，其实执行的是 app 的 loadApp 方法。
```
function performAppChanges() {
  return Promise.resolve().then(() => {
    // https://github.com/single-spa/single-spa/issues/545

    // 事件 single-spa:before-no-app-change 或者 single-spa:before-app-change
    // 前者表示本次 reroute 有应用需要改变
    // 后者表示本次 reroute 没有应用需要改变
    window.dispatchEvent(
      new CustomEvent(
        appsThatChanged.length === 0
          ? "single-spa:before-no-app-change"
          : "single-spa:before-app-change",
        getCustomEventDetail(true)
      )
    );

    // 事件 single-spa:before-routing-event
    // 只要 reroute ，该事件就会触发
    window.dispatchEvent(
      new CustomEvent(
        "single-spa:before-routing-event",
        getCustomEventDetail(true)
      )
    );

    // appsToUnload 存放的是等待执行 unload 操作的 app
    // 每个 app 都执行 toUnloadPromise 操作
    // 执行 unload 生命周期函数
    const unloadPromises = appsToUnload.map(toUnloadPromise);

    // unmount 之后紧接着调用 unload
    const unmountUnloadPromises = appsToUnmount
      .map(toUnmountPromise)
      .map((unmountPromise) => unmountPromise.then(toUnloadPromise));

    const allUnmountPromises = unmountUnloadPromises.concat(unloadPromises);

    const unmountAllPromise = Promise.all(allUnmountPromises);

    // 所有的 unmount 和 toUnload 都执行完毕后，
    unmountAllPromise.then(() => {
      window.dispatchEvent(
        new CustomEvent(
          "single-spa:before-mount-routing-event",
          getCustomEventDetail(true)
        )
      );
    });

    /* We load and bootstrap apps while other apps are unmounting, but we
      * wait to mount the app until all apps are finishing unmounting
      */

    // appsToLoad 表示当前需要加载的 app
    const loadThenMountPromises = appsToLoad.map((app) => {
      // toLoadPromise 执行了 loadApp 方法，并且在 app 上挂载了生命周期函数以及超时配置。
      return toLoadPromise(app).then((app) =>
        // load 之后依次执行 bootstrap 和 mount 生命周期
        tryToBootstrapAndMount(app, unmountAllPromise)
      );
    });

    /* These are the apps that are already bootstrapped and just need
      * to be mounted. They each wait for all unmounting apps to finish up
      * before they mount.
      */

    // 找出在 appsToMount 但是不在 appsToLoad 中的应用，也就是 app 完成了 load 操作，但是没有执行 bootstrap 和 mount
    // 执行 tryToBootstrapAndMount
    const mountPromises = appsToMount
      .filter((appToMount) => appsToLoad.indexOf(appToMount) < 0)
      .map((appToMount) => {
        return tryToBootstrapAndMount(appToMount, unmountAllPromise);
      });


    return unmountAllPromise
      .catch((err) => {
        callAllEventListeners();
        throw err;
      })
      .then(() => {
        /* Now that the apps that needed to be unmounted are unmounted, their DOM navigation
          * events (like hashchange or popstate) should have been cleaned up. So it's safe
          * to let the remaining captured event listeners to handle about the DOM event.
          */
        // 处理浏览器  navigation 变化的监听函数
        // 此时应用的变更已经完毕，可以处理微应用上的回调函数了
        callAllEventListeners();

        // 等待 loadThenMountPromises 和 mountPromises 都执行完毕 mount
        return Promise.all(loadThenMountPromises.concat(mountPromises))
          .catch((err) => {
            pendingPromises.forEach((promise) => promise.reject(err));
            throw err;
          })
          .then(finishUpAndReturn);
      });
  });
}
```

**总结一下 reroute 过程中，single-spa 的自定义的事件:**

1. single-spa:before-no-app-change：每次进入 reroute 方法，会判断本次 reroute 有无应用状态发生改变，如果没有，产生该事件。
2. single-spa:before-app-change：每次进入 reroute 方法，会判断本次 reroute 有无应用状态发生改变，如果有，产生该事件。
3. single-spa:before-routing-event：紧跟在上述事件之后发生，每次 reroute 开始一定会发生。
4. single-spa:before-mount-routing-event：url 发行改变后，旧的应用卸载完毕后，触发该事件，表示后续要开始加载应用。
5. single-spa:before-first-mount：只发出一次，第一次 mount 应用之前产生该事件。
6. single-spa:first-mount：只发出一次，第一次 mount 应用之后产生该事件。
7. single-spa:no-app-change：与事件 1 是一致的，只不过发生在 reroute 方法结束。
8. single-spa:app-change：与事件 2 是一致的，只不过发生在 reroute 方法结束。
9. single-spa:routing-event：与事件 3 对应，发生在 reroute 结束。

reroute 流程作为 single-spa 的核心流程，充当了一个应用状态机的角色，控制了应用的生命周期的流转和事件分发。qiankun 就是利用了这一特性，将应用交给 single-spa 管理，自己实现应用的加载方法（loadApp）和生命周期。
