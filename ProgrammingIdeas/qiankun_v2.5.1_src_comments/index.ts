/**
 * @author Kuitos
 * @since 2019-04-25
 */

export { loadMicroApp, registerMicroApps, start } from './apis'; // loadMicroApp手动加载微应用, registerMicroApps注册微应用, start启动应用
export { initGlobalState } from './globalState'; // 全局state
export { getCurrentRunningApp as __internalGetCurrentRunningApp } from './sandbox'; // 应用运行时沙箱
export * from './errorHandler'; // 错误处理
export * from './effects'; // 微应用加载相关
export * from './interfaces'; // 类型定义
export { prefetchImmediately as prefetchApps } from './prefetch'; // 应用预加载
