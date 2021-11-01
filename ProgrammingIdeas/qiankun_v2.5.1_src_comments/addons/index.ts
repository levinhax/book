/**
 * @author Kuitos
 * @since 2020-03-02
 */

import { concat, mergeWith } from 'lodash';
import type { FrameworkLifeCycles, ObjectType } from '../interfaces';

import getRuntimePublicPathAddOn from './runtimePublicPath';
import getEngineFlagAddon from './engineFlag';

// 为 windows 对象增加生命周期方法
export default function getAddOns<T extends ObjectType>(global: Window, publicPath: string): FrameworkLifeCycles<T> {
  // global 上增加属性或方法
  return mergeWith({}, getEngineFlagAddon(global), getRuntimePublicPathAddOn(global, publicPath), (v1, v2) =>
    concat(v1 ?? [], v2 ?? []),
  );
}
