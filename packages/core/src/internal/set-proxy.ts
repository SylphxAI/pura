/**
 * Set Proxy - HAMT-based persistent Set with Set-like interface
 */

import type { Owner } from './types';
import {
  SET_ADAPTIVE_THRESHOLD,
  hamtEmpty,
  hamtHas,
  hamtSet,
  hamtDelete,
  hamtIter,
  hamtToEntries,
  type HMap,
  orderEmpty,
  orderFromSetBase,
  orderAppend,
  orderDelete,
  orderIter,
  type OrderIndex,
} from './index';

export interface HSetState<T> {
  map: HMap<T, true>;
  isDraft: boolean;
  owner?: Owner;
  modified: boolean;
  ordered?: OrderIndex<T> | null;
}

export const SET_STATE_ENV = new WeakMap<any, HSetState<any>>();


// Create a lightweight draft proxy for native Sets (Immer-like)
function createNativeSetDraftProxy<T>(
  data: Set<T>,
  markModified: () => void
): Set<T> {
  const proxy = new Proxy(data, {
    get(target, prop) {
      if (prop === 'size') return target.size;

      if (prop === 'has') {
        return (value: T) => target.has(value);
      }

      if (prop === 'add') {
        return (value: T) => {
          const hadBefore = target.has(value);
          target.add(value);
          if (!hadBefore) markModified();
          return proxy;
        };
      }

      if (prop === 'delete') {
        return (value: T) => {
          const result = target.delete(value);
          if (result) markModified();
          return result;
        };
      }

      if (prop === 'clear') {
        return () => {
          if (target.size > 0) {
            target.clear();
            markModified();
          }
        };
      }

      const value = Reflect.get(target, prop);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  return proxy;
}

export function hamtFromSet<T>(s: Set<T>): HMap<T, true> {
  let map = hamtEmpty<T, true>();
  const owner: Owner = {};
  for (const v of s) {
    map = hamtSet(map, owner, v, true);
  }
  return map;
}

export function hamtToSetValues<T>(map: HMap<T, true>): T[] {
  const entries = hamtToEntries(map) as [T, true][];
  return entries.map(([k]) => k);
}

export function createSetProxy<T>(state: HSetState<T>): Set<T> {
  const target = new Set<T>();

  const proxy = new Proxy(target, {
    get(target, prop, receiver) {
      if (prop === '__PURA_SET_STATE__') return state;
      if (prop === 'size') return state.map.size;

      if (prop === 'has') {
        return (value: T): boolean => hamtHas(state.map, value);
      }

      if (prop === 'add') {
        return (value: T) => {
          const had = hamtHas(state.map, value);
          const newMap = hamtSet(state.map, state.owner, value, true);
          if (newMap !== state.map) {
            state.map = newMap;
            if (!had) {
              if (state.ordered) {
                state.ordered = orderAppend(state.ordered, state.owner, value);
              }
              state.modified = true;
            }
          }
          return proxy;
        };
      }

      if (prop === 'delete') {
        return (value: T) => {
          const before = state.map.size;
          state.map = hamtDelete(state.map, state.owner, value);
          const removed = state.map.size !== before;
          if (removed) {
            if (state.ordered) {
              state.ordered = orderDelete(state.ordered, state.owner, value);
            }
            state.modified = true;
          }
          return removed;
        };
      }

      if (prop === 'clear') {
        return () => {
          if (state.map.size === 0) return;
          state.map = hamtEmpty<T, true>();
          if (state.ordered) {
            state.ordered = orderEmpty<T>();
          }
          state.modified = true;
        };
      }

      const iterValues = function* (): IterableIterator<T> {
        if (state.ordered) {
          yield* orderIter(state.ordered);
        } else {
          for (const [v] of hamtIter(state.map)) {
            yield v;
          }
        }
      };

      if (prop === Symbol.iterator || prop === 'values' || prop === 'keys') {
        return function* () {
          yield* iterValues();
        };
      }

      if (prop === 'entries') {
        return function* () {
          for (const v of iterValues()) {
            yield [v, v] as [T, T];
          }
        };
      }

      if (prop === 'forEach') {
        return (cb: (value: T, value2: T, set: Set<T>) => void, thisArg?: any) => {
          for (const v of iterValues()) {
            cb.call(thisArg, v, v, proxy);
          }
        };
      }

      if (prop === 'toJSON') {
        return () => hamtToSetValues(state.map);
      }

      return Reflect.get(target, prop, receiver);
    },
  });

  SET_STATE_ENV.set(proxy, state);
  return proxy;
}

export function produceSet<T>(
  base: Set<T>,
  recipe: (draft: Set<T>) => void
): Set<T> {
  const baseState = SET_STATE_ENV.get(base as any);
  const isBaseProxy = !!baseState;
  const baseSize = isBaseProxy ? baseState.map.size : base.size;

  // Case 1: native small → native (Immer-like approach)
  if (!isBaseProxy && baseSize < SET_ADAPTIVE_THRESHOLD) {
    const draftData = new Set(base); // shallow copy
    let modified = false;

    const draft = createNativeSetDraftProxy(draftData, () => { modified = true; });
    recipe(draft);

    if (!modified) return base;

    // Check result size: upgrade to HAMT if large
    if (draftData.size >= SET_ADAPTIVE_THRESHOLD) {
      const hamt = hamtFromSet(draftData);
      const ordered = orderFromSetBase(draftData);
      const finalState: HSetState<T> = {
        map: hamt,
        isDraft: false,
        owner: undefined,
        modified: false,
        ordered,
      };
      return createSetProxy<T>(finalState);
    }

    // Still small → return native
    return draftData;
  }

  // Case 2 & 3: large native or already proxy → use HAMT
  let baseMap: HMap<T, true>;
  let baseOrdered: OrderIndex<T> | null = null;
  if (baseState) {
    baseMap = baseState.map;
    baseOrdered = baseState.ordered || null;
  } else {
    baseMap = hamtFromSet(base);
    baseOrdered = orderFromSetBase(base);
  }

  const draftOwner: Owner = {};
  const draftState: HSetState<T> = {
    map: baseMap,
    isDraft: true,
    owner: draftOwner,
    modified: false,
    ordered: baseOrdered,
  };

  const draft = createSetProxy<T>(draftState);
  recipe(draft);

  if (!draftState.modified) return base;

  // Case 4: Check result size - downgrade to native if small
  if (draftState.map.size < SET_ADAPTIVE_THRESHOLD) {
    const result = new Set<T>();
    if (draftState.ordered) {
      for (const v of orderIter(draftState.ordered)) {
        result.add(v);
      }
    } else {
      for (const [v] of hamtIter(draftState.map)) {
        result.add(v);
      }
    }
    return result;
  }

  // Still large → return HAMT proxy
  const finalState: HSetState<T> = {
    map: draftState.map,
    isDraft: false,
    owner: undefined,
    modified: false,
    ordered: draftState.ordered,
  };

  return createSetProxy<T>(finalState);
}
