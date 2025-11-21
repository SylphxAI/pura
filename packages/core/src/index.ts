/**
 * Pura v4.5 Diamond – Vec + Object + HAMT Map + HAMT Set
 *
 * - pura([])        → Bit-trie persistent vector proxy
 * - pura({})        → Deep Immer-style object proxy
 * - pura(new Map)   → HAMT-style persistent Map proxy
 * - pura(new Set)   → HAMT-style persistent Set proxy
 * - produce(...)    → 同一 API 操作四種結構
 */

import {
  NESTED_PROXY_STATE,
  NESTED_MAP_STATE,
  NESTED_SET_STATE,
  PROXY_CACHE,
  ARRAY_ADAPTIVE_THRESHOLD,
  OBJECT_ADAPTIVE_THRESHOLD,
  MAP_ADAPTIVE_THRESHOLD,
  SET_ADAPTIVE_THRESHOLD,
  vecFromArray,
  vecToArray,
  vecIter,
  hamtGet,
  hamtFromMap,
  hamtIter,
  orderFromBase,
  orderFromSetBase,
  orderIter,
  orderEntryIter,
  createNestedProxy,
  createNestedMapProxy,
  createNestedSetProxy,
  isProxyModified,
  extractNestedValue,
  type NestedProxyState,
  type NestedMapState,
  type NestedSetState,
  createArrayProxy,
  produceArray,
  ARRAY_STATE_ENV,
  createMapProxy,
  produceMap,
  MAP_STATE_ENV,
  createSetProxy,
  produceSet,
  hamtFromSet,
  hamtToSetValues,
  SET_STATE_ENV,
} from './internal';

// =====================================================
// Object produce (root object) - Adaptive
// =====================================================

function produceObject<T extends object>(
  base: T,
  recipe: (draft: T) => void
): T {
  const maybeNested = (base as any)[NESTED_PROXY_STATE] as
    | NestedProxyState<T>
    | undefined;
  const isBaseProxy = !!maybeNested;

  const plainBase = maybeNested
    ? (maybeNested.copy || maybeNested.base)
    : base;

  const basePropCount = Object.keys(plainBase).length;

  // Case 1: native small → native (Immer-like with shallow copy)
  if (!isBaseProxy && basePropCount < OBJECT_ADAPTIVE_THRESHOLD) {
    const copy = { ...plainBase };
    let modified = false;
    const childProxies = new Map<string | symbol, any>();

    const draft = new Proxy(copy, {
      get(target, prop, receiver) {
        if (prop === NESTED_PROXY_STATE) {
          return { base: plainBase, copy, childProxies };
        }

        const value = Reflect.get(target, prop, receiver);

        if (value !== null && typeof value === 'object') {
          if (value instanceof Date || value instanceof RegExp ||
              value instanceof Error || value instanceof Promise ||
              ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
            return value;
          }

          if (!childProxies.has(prop)) {
            if (value instanceof Map) {
              const mapDraft = createNestedMapProxy(value as Map<any, any>, () => { modified = true; });
              childProxies.set(prop, mapDraft);
            } else if (value instanceof Set) {
              const setDraft = createNestedSetProxy(value as Set<any>, () => { modified = true; });
              childProxies.set(prop, setDraft);
            } else {
              childProxies.set(prop, createNestedProxy(value as object, () => { modified = true; }));
            }
          }
          return childProxies.get(prop);
        }

        return value;
      },
      set(target, prop, value) {
        modified = true;
        childProxies.delete(prop);
        (target as any)[prop] = value;
        return true;
      },
      deleteProperty(target, prop) {
        modified = true;
        childProxies.delete(prop);
        return Reflect.deleteProperty(target, prop);
      }
    }) as T;

    recipe(draft);

    // Finalize nested proxies
    if (childProxies.size > 0) {
      for (const [key, childProxy] of childProxies) {
        if (isProxyModified(childProxy)) {
          const finalValue = extractNestedValue(childProxy);
          if (finalValue !== (copy as any)[key]) {
            (copy as any)[key] = finalValue;
            modified = true;
          }
        }
      }
    }

    if (!modified) return base;

    // Check result size: upgrade to proxy if large
    const resultPropCount = Object.keys(copy).length;
    if (resultPropCount >= OBJECT_ADAPTIVE_THRESHOLD) {
      const proxy = createNestedProxy(copy, () => {}) as T;
      PROXY_CACHE.set(copy, proxy);
      return proxy;
    }

    // Still small → return native
    return copy;
  }

  // Case 2 & 3: large native or already proxy → use nested proxy
  let modified = false;
  const draft = createNestedProxy(plainBase, () => {
    modified = true;
  }) as T;

  recipe(draft);

  if (!isProxyModified(draft)) {
    return base;
  }

  const result = extractNestedValue(draft) as T;

  // Case 4: Check result size - downgrade to native if small
  const resultPropCount = Object.keys(result).length;
  if (resultPropCount < OBJECT_ADAPTIVE_THRESHOLD) {
    return result; // Return plain object
  }

  // Still large → return proxy
  return pura(result);
}

// =====================================================
// Re-export adaptive thresholds (defined in internal/adaptive-thresholds.ts)
// =====================================================

export {
  ARRAY_ADAPTIVE_THRESHOLD,
  OBJECT_ADAPTIVE_THRESHOLD,
  MAP_ADAPTIVE_THRESHOLD,
  SET_ADAPTIVE_THRESHOLD,
};

// =====================================================
// Public APIs
// =====================================================

/**
 * Create a Pura value with adaptive optimization.
 * - Small array (< 512) → native copy (zero overhead)
 * - Large array (>= 512) → bit-trie Vec proxy (structural sharing)
 * - Object → deep COW proxy
 * - Small Map/Set (< 512) → native copy
 * - Large Map/Set (>= 512) → HAMT proxy with insertion order
 */
export function pura<T>(value: T): T {
  if (Array.isArray(value)) {
    const arr = value as any[];
    if (ARRAY_STATE_ENV.has(arr)) return value;

    // Small array → return native copy
    if (arr.length < ARRAY_ADAPTIVE_THRESHOLD) {
      return arr.slice() as any as T;
    }

    // Large array → return tree proxy
    const vec = vecFromArray(arr);
    return createArrayProxy<any>({
      vec,
      isDraft: false,
      owner: undefined,
      modified: false,
    }) as any as T;
  }

  if (value instanceof Map) {
    const m = value as Map<any, any>;
    if (MAP_STATE_ENV.has(m)) return value;

    // Small Map → return native copy
    if (m.size < MAP_ADAPTIVE_THRESHOLD) {
      return new Map(m) as any as T;
    }

    // Large Map → return HAMT proxy (ordered by default)
    const hamt = hamtFromMap(m);
    const ordered = orderFromBase(m);
    return createMapProxy({
      map: hamt,
      isDraft: false,
      owner: undefined,
      modified: false,
      ordered,
    }) as any as T;
  }

  if (value instanceof Set) {
    const s = value as Set<any>;
    if (SET_STATE_ENV.has(s)) return value;

    // Small Set → return native copy
    if (s.size < SET_ADAPTIVE_THRESHOLD) {
      return new Set(s) as any as T;
    }

    // Large Set → return HAMT proxy (ordered by default)
    const hamt = hamtFromSet(s);
    const ordered = orderFromSetBase(s);
    return createSetProxy({
      map: hamt,
      isDraft: false,
      owner: undefined,
      modified: false,
      ordered,
    }) as any as T;
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as any;
    if (obj[NESTED_PROXY_STATE]) return value;

    if (PROXY_CACHE.has(obj)) {
      return PROXY_CACHE.get(obj) as T;
    }

    // Count own enumerable properties
    const propCount = Object.keys(obj).length;

    // Small object → return shallow copy
    if (propCount < OBJECT_ADAPTIVE_THRESHOLD) {
      return { ...obj } as T;
    }

    // Large object → return nested proxy
    const proxy = createNestedProxy(obj, () => {}) as any as T;
    PROXY_CACHE.set(obj, proxy);
    return proxy;
  }

  return value;
}


/**
 * Convert Pura value back to plain JS.
 * - Array → native array
 * - Map   → native Map
 * - Set   → native Set
 * - Object (nested proxy) → plain object
 */
export function unpura<T>(value: T): T {
  if (Array.isArray(value)) {
    const state = ARRAY_STATE_ENV.get(value as any[]);
    if (!state) return value;
    return vecToArray(state.vec) as any as T;
  }

  if (value instanceof Map) {
    const top = MAP_STATE_ENV.get(value as any);
    if (top) {
      if (top.ordered) {
        const out = new Map();
        if (top.ordered.idxToVal) {
          for (const [k, v] of orderEntryIter(top.ordered)) {
            out.set(k, v);
          }
        } else {
          for (const k of orderIter(top.ordered)) {
            out.set(k, hamtGet(top.map, k));
          }
        }
        return out as any as T;
      }
      return new Map(hamtIter(top.map)) as any as T;
    }

    const nested = (value as any)[NESTED_MAP_STATE] as NestedMapState<any, any> | undefined;
    if (nested) return (nested.copy || nested.base) as any as T;

    return value;
  }

  if (value instanceof Set) {
    const top = SET_STATE_ENV.get(value as any);
    if (top) {
      const s = new Set<T>();
      if (top.ordered) {
        for (const k of orderIter(top.ordered)) {
          s.add(k as T);
        }
      } else {
        for (const [k] of hamtIter(top.map)) {
          s.add(k as T);
        }
      }
      return s as any as T;
    }

    const nested = (value as any)[NESTED_SET_STATE] as NestedSetState<any> | undefined;
    if (nested) return (nested.copy || nested.base) as any as T;

    return value;
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as any;
    if (obj[NESTED_PROXY_STATE]) {
      return extractNestedValue(obj);
    }
  }

  return value;
}

/**
 * Detect if value is managed by Pura (array / object / map / set).
 */
export function isPura<T>(value: T): boolean {
  if (Array.isArray(value)) {
    return ARRAY_STATE_ENV.has(value as any[]);
  }
  if (value instanceof Map) {
    return MAP_STATE_ENV.has(value as any);
  }
  if (value instanceof Set) {
    return SET_STATE_ENV.has(value as any);
  }
  if (value !== null && typeof value === 'object') {
    return Boolean((value as any)[NESTED_PROXY_STATE]);
  }
  return false;
}

/**
 * Re-wrap a value into optimized Pura representation.
 */
export function repura<T>(value: T): T {
  return pura(unpura(value));
}

/**
 * Immutable update with structural sharing.
 * - Array → Vec + transients
 * - Object → deep proxy
 * - Map → HAMT + transients
 * - Set → HAMT + transients
 */
export function produce<T>(base: T, recipe: (draft: T) => void): T {
  if (Array.isArray(base)) {
    return produceArray(base as any[], recipe as any) as any as T;
  }

  if (base instanceof Map) {
    return produceMap(base as any, recipe as any) as any as T;
  }

  if (base instanceof Set) {
    return produceSet(base as any, recipe as any) as any as T;
  }

  if (base !== null && typeof base === 'object') {
    return produceObject(base as any, recipe as any) as any as T;
  }

  recipe(base);
  return base;
}

// =====================================================
// ProduceFast - Immutable mutation without proxy tracking
// =====================================================

export { produceFast } from './produce-fast';
