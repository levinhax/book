/**
 * @author Kuitos
 * @since 2019-11-12
 */
import type { FrameworkLifeCycles } from '../interfaces';

const rawPublicPath = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;

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
