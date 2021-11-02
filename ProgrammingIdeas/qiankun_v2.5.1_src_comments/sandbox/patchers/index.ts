/**
 * @author Kuitos
 * @since 2019-04-11
 */

import type { Freer, SandBox } from '../../interfaces';
import { SandBoxType } from '../../interfaces';
import * as css from './css';
import { patchLooseSandbox, patchStrictSandbox } from './dynamicAppend';
import patchHistoryListener from './historyListener';
import patchInterval from './interval';
import patchWindowListener from './windowListener';

export function patchAtMounting(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  sandbox: SandBox,
  scopedCSS: boolean,
  excludeAssetFilter?: CallableFunction,
): Freer[] {
  const basePatchers = [
    () => patchInterval(sandbox.proxy),
    () => patchWindowListener(sandbox.proxy),
    () => patchHistoryListener(),
  ];

  const patchersInSandbox = {
    [SandBoxType.LegacyProxy]: [
      ...basePatchers,
      () => patchLooseSandbox(appName, elementGetter, sandbox.proxy, true, scopedCSS, excludeAssetFilter),
    ],
    [SandBoxType.Proxy]: [
      ...basePatchers,
      () => patchStrictSandbox(appName, elementGetter, sandbox.proxy, true, scopedCSS, excludeAssetFilter),
    ],
    [SandBoxType.Snapshot]: [
      ...basePatchers,
      () => patchLooseSandbox(appName, elementGetter, sandbox.proxy, true, scopedCSS, excludeAssetFilter),
    ],
  };

  return patchersInSandbox[sandbox.type]?.map((patch) => patch());
}

// 对 document.createElement，HTML DOM appendChild，HTML DOM removeChild，HTML DOM insertBefore 做处理，以便 style 和 script 能顺利的挂载到微应用下面
export function patchAtBootstrapping(
  appName: string,
  elementGetter: () => HTMLElement | ShadowRoot,
  sandbox: SandBox,
  scopedCSS: boolean,
  excludeAssetFilter?: CallableFunction,
): Freer[] {
  const patchersInSandbox = {
    [SandBoxType.LegacyProxy]: [
      () => patchLooseSandbox(appName, elementGetter, sandbox.proxy, false, scopedCSS, excludeAssetFilter),
    ],
    [SandBoxType.Proxy]: [
      () => patchStrictSandbox(appName, elementGetter, sandbox.proxy, false, scopedCSS, excludeAssetFilter),
    ],
    [SandBoxType.Snapshot]: [
      () => patchLooseSandbox(appName, elementGetter, sandbox.proxy, false, scopedCSS, excludeAssetFilter),
    ],
  };

  return patchersInSandbox[sandbox.type]?.map((patch) => patch());
}

export { css };
