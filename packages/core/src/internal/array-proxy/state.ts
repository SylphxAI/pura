/**
 * Array Proxy - State container and global registry
 */

import type { Owner, Vec } from "../types";

export interface PuraArrayState<T> {
  vec: Vec<T>;
  isDraft: boolean;
  owner?: Owner;
  modified: boolean;
  proxies?: Map<number, any>;
  cachedLeaf?: T[];
  cachedLeafStart?: number;
  methodCache?: Map<string | symbol, Function>;
}

export const ARRAY_STATE_ENV = new WeakMap<any[], PuraArrayState<any>>();
