## 应用间通讯

传统的 iframe 使用的是全局监听消息的方式，但是这种方式限制很多，不能传递无法序列化的消息，复杂的交互中很容易导致逻辑混乱。

qiankun 对外提供了一种应用间通讯的方式，简单的说，qiankun 在主应用中维护了一个变量，gloabalState，并对外提供了一些监听方法，这样微应用只要注册监听器，就能知道 gloabalState 发生了变化，并且获得 gloabalState 最新的值，同样，微应用也可以修改这个值，其它的微应用也能感知到。那现在的问题就变成了，微应用如何获得主应用提供的监听方法？主应用在加载微应用的时候，会调用微应用的生命周期函数，利用这个特性，主应用将监听函数以参数的形式传递给微应用，这样微应用就可以适应主应用的函数来进行事件监听。

initGlobalState 方法就是主应用在初始化的时候调用的，用来给 gloabalState 赋初值。

qiankun/src/globalState.ts
```
let gloabalState: Record<string, any> = {};

export function initGlobalState(state: Record<string, any> = {}) {
  // 传入的 state 无任何变化
  if (state === gloabalState) {
    console.warn('[qiankun] state has not changed！');
  } else {
    // loadash cloneDeep 方法
    const prevGloabalState = cloneDeep(gloabalState);
    gloabalState = cloneDeep(state);

    // 触发全局监听
    emitGloabl(gloabalState, prevGloabalState);
  }
  return getMicroAppStateActions(`gloabal-${+new Date()}`, true);
}
```

deps 对象中存储了所有的监听器，key 代表应用的唯一标识，value 则是回到函数。emitGloabl 方法就是遍历 deps 对象，依次触发回调函数。
```
// deps 中注册了全局监听器
const deps: Record<string, OnGlobalStateChangeCallback> = {};

function emitGloabl(state: Record<string, any>, prevState: Record<string, any>) {
  Object.keys(deps).forEach((id: string) => {
    if (deps[id] instanceof Function) {
      // 依次触发监听
      deps[id](cloneDeep(state), cloneDeep(prevState));
    }
  });
}
```

getMicroAppStateActions 是 initGlobalState 的返回值，getMicroAppStateActions 返回三个函数，分别是 onGlobalStateChange，setGlobalState，offGlobalStateChange。

- onGlobalStateChange 用于注册监听 gloabalState 的监听器。
- setGlobalState 方法用于改变 gloabalState 的值。
- offGlobalStateChange 用于注销监听器。

```
export function getMicroAppStateActions(id: string, isMaster?: boolean): MicroAppStateActions {
  return {
    /**
     * onGlobalStateChange 全局依赖监听
     *
     * 收集 setState 时所需要触发的依赖
     *
     * 限制条件：每个子应用只有一个激活状态的全局监听，新监听覆盖旧监听，若只是监听部分属性，请使用 onGlobalStateChange
     *
     * 这么设计是为了减少全局监听滥用导致的内存爆炸
     *
     * 依赖数据结构为：
     * {
     *   {id}: callback
     * }
     *
     * @param callback
     * @param fireImmediately
     */
    onGlobalStateChange(callback: OnGlobalStateChangeCallback, fireImmediately?: boolean) {
      if (!(callback instanceof Function)) {
        console.error('[qiankun] callback must be function!');
        return;
      }
      if (deps[id]) {
        console.warn(`[qiankun] '${id}' global listener already exists before this, new listener will overwrite it.`);
      }
      deps[id] = callback;
      if (fireImmediately) {
        const cloneState = cloneDeep(globalState);
        callback(cloneState, cloneState);
      }
    },

    /**
     * setGlobalState 更新 store 数据
     *
     * 1. 对输入 state 的第一层属性做校验，只有初始化时声明过的第一层（bucket）属性才会被更改
     * 2. 修改 store 并触发全局监听
     *
     * @param state
     */
    setGlobalState(state: Record<string, any> = {}) {
      if (state === globalState) {
        console.warn('[qiankun] state has not changed！');
        return false;
      }

      const changeKeys: string[] = [];
      const prevGlobalState = cloneDeep(globalState);
      globalState = cloneDeep(
        Object.keys(state).reduce((_globalState, changeKey) => {
          if (isMaster || _globalState.hasOwnProperty(changeKey)) {
            changeKeys.push(changeKey);
            return Object.assign(_globalState, { [changeKey]: state[changeKey] });
          }
          console.warn(`[qiankun] '${changeKey}' not declared when init state！`);
          return _globalState;
        }, globalState),
      );
      if (changeKeys.length === 0) {
        console.warn('[qiankun] state has not changed！');
        return false;
      }
      emitGlobal(globalState, prevGlobalState);
      return true;
    },

    // 注销该应用下的依赖
    offGlobalStateChange() {
      delete deps[id];
      return true;
    },
  };
}
```
