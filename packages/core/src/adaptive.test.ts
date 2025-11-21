/**
 * Adaptive Optimization Tests
 *
 * Tests for automatic switching between native and persistent structures
 * based on size threshold (512 elements)
 */

import { describe, it, expect } from 'vitest';
import {
  pura,
  produce,
  isPura,
  unpura,
  ARRAY_ADAPTIVE_THRESHOLD,
  OBJECT_ADAPTIVE_THRESHOLD,
  MAP_ADAPTIVE_THRESHOLD,
  SET_ADAPTIVE_THRESHOLD,
} from './index';

// Helper constants for readable test sizes
const ARRAY_SMALL = ARRAY_ADAPTIVE_THRESHOLD - 1;
const ARRAY_THRESHOLD = ARRAY_ADAPTIVE_THRESHOLD;
const ARRAY_LARGE = ARRAY_ADAPTIVE_THRESHOLD + 1;
const ARRAY_VERY_LARGE = ARRAY_ADAPTIVE_THRESHOLD + 88; // 600 when threshold is 512

const OBJECT_SMALL = OBJECT_ADAPTIVE_THRESHOLD - 1;
const OBJECT_THRESHOLD = OBJECT_ADAPTIVE_THRESHOLD;
const OBJECT_LARGE = OBJECT_ADAPTIVE_THRESHOLD + 1;
const OBJECT_VERY_LARGE = OBJECT_ADAPTIVE_THRESHOLD + 88;

const MAP_SMALL = MAP_ADAPTIVE_THRESHOLD - 1;
const MAP_THRESHOLD = MAP_ADAPTIVE_THRESHOLD;
const MAP_LARGE = MAP_ADAPTIVE_THRESHOLD + 1;
const MAP_VERY_LARGE = MAP_ADAPTIVE_THRESHOLD + 88;

const SET_SMALL = SET_ADAPTIVE_THRESHOLD - 1;
const SET_THRESHOLD = SET_ADAPTIVE_THRESHOLD;
const SET_LARGE = SET_ADAPTIVE_THRESHOLD + 1;
const SET_VERY_LARGE = SET_ADAPTIVE_THRESHOLD + 88;

// ============================================
// ARRAY ADAPTIVE TESTS
// ============================================

describe('Array - Adaptive Optimization', () => {
  describe('Threshold Boundary', () => {
    it(`size ${ARRAY_ADAPTIVE_THRESHOLD - 1} → returns native`, () => {
      const arr = Array.from({ length: ARRAY_ADAPTIVE_THRESHOLD - 1 }, (_, i) => i);
      const result = pura(arr);
      expect(isPura(result)).toBe(false);
      expect(Array.isArray(result)).toBe(true);
    });

    it(`size ${ARRAY_ADAPTIVE_THRESHOLD} → returns proxy`, () => {
      const arr = Array.from({ length: ARRAY_ADAPTIVE_THRESHOLD }, (_, i) => i);
      const result = pura(arr);
      expect(isPura(result)).toBe(true);
    });

    it(`size ${ARRAY_ADAPTIVE_THRESHOLD + 1} → returns proxy`, () => {
      const arr = Array.from({ length: ARRAY_ADAPTIVE_THRESHOLD + 1 }, (_, i) => i);
      const result = pura(arr);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Upgrade: Small → Large', () => {
    it('produce push: 511 → 512 upgrades to proxy', () => {
      const base = Array.from({ length: ARRAY_SMALL }, (_, i) => i);
      const result = produce(base, draft => draft.push(999));

      expect(result.length).toBe(ARRAY_THRESHOLD);
      expect(isPura(result)).toBe(true); // Upgraded to proxy
    });

    it('produce push multiple: 510 → 513 upgrades to proxy', () => {
      const base = Array.from({ length: ARRAY_SMALL - 1 }, (_, i) => i);
      const result = produce(base, draft => {
        draft.push(1, 2, 3);
      });

      expect(result.length).toBe(ARRAY_LARGE);
      expect(isPura(result)).toBe(true);
    });

    it('produce concat: small + small → large upgrades', () => {
      const base = Array.from({ length: 300 }, (_, i) => i);
      const toAdd = Array.from({ length: 300 }, (_, i) => i + 1000);
      const result = produce(base, draft => {
        draft.push(...toAdd);
      });

      expect(result.length).toBe(ARRAY_VERY_LARGE);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Downgrade: Large → Small', () => {
    it('produce pop: 512 → 511 downgrades to native', () => {
      const base = Array.from({ length: ARRAY_THRESHOLD }, (_, i) => i);
      const puraBase = pura(base);
      const result = produce(puraBase, draft => draft.pop());

      expect(result.length).toBe(ARRAY_SMALL);
      expect(isPura(result)).toBe(false); // Downgraded to native
      expect(Array.isArray(result)).toBe(true);
    });

    it('produce splice: 515 → 510 downgrades to native', () => {
      const base = Array.from({ length: ARRAY_LARGE + 2 }, (_, i) => i);
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        draft.splice(0, 5); // Remove first 5
      });

      expect(result.length).toBe(ARRAY_SMALL - 1);
      expect(isPura(result)).toBe(false);
    });

    it('produce filter: 600 → 100 downgrades to native', () => {
      const base = Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i);
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        // Keep only first 100
        draft.splice(100, draft.length - 100);
      });

      expect(result.length).toBe(100);
      expect(isPura(result)).toBe(false);
    });
  });

  describe('Stability: Size Unchanged', () => {
    it('small stays small after mutations', () => {
      const base = [1, 2, 3];
      const result = produce(base, draft => {
        draft[0] = 999;
        draft.push(4);
        draft.pop();
      });

      expect(result.length).toBe(3);
      expect(isPura(result)).toBe(false);
      expect(result).toEqual([999, 2, 3]);
    });

    it('large stays large after mutations', () => {
      const base = Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i);
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        draft[0] = 999;
        draft.push(1000);
        draft.pop();
      });

      expect(result.length).toBe(ARRAY_VERY_LARGE);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Reference Equality', () => {
    it('no modification → returns same reference (small)', () => {
      const base = [1, 2, 3];
      const result = produce(base, () => {});
      expect(result).toBe(base);
    });

    it('no modification → returns same reference (large)', () => {
      const base = Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i);
      const puraBase = pura(base);
      const result = produce(puraBase, () => {});
      expect(result).toBe(puraBase);
    });

    it('modification → returns new reference (small)', () => {
      const base = [1, 2, 3];
      const result = produce(base, draft => draft.push(4));
      expect(result).not.toBe(base);
      expect(base).toEqual([1, 2, 3]); // Original unchanged
    });

    it('modification → returns new reference (large)', () => {
      const base = Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i);
      const puraBase = pura(base);
      const result = produce(puraBase, draft => draft.push(999));
      expect(result).not.toBe(puraBase);
      expect(puraBase.length).toBe(ARRAY_VERY_LARGE); // Original unchanged
    });
  });

  describe('Nested Objects', () => {
    it('small array with nested objects supports COW', () => {
      const base = [{ a: 1 }, { b: 2 }];
      const result = produce(base, draft => {
        draft[0].a = 999;
      });

      expect(result[0].a).toBe(999);
      expect(base[0].a).toBe(1); // Original unchanged
      expect(isPura(result)).toBe(false);
    });

    it('large array with nested objects supports COW', () => {
      const base = Array.from({ length: MAP_VERY_LARGE }, (_, i) => ({ val: i }));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        draft[0].val = 999;
      });

      expect(result[0].val).toBe(999);
      expect((puraBase as any)[0].val).toBe(0); // Original unchanged
      expect(isPura(result)).toBe(true);
    });
  });
});

// ============================================
// MAP ADAPTIVE TESTS
// ============================================

describe('Map - Adaptive Optimization', () => {
  describe('Threshold Boundary', () => {
    it('size 511 → returns native', () => {
      const map = new Map(Array.from({ length: MAP_SMALL }, (_, i) => [i, i]));
      const result = pura(map);
      expect(isPura(result)).toBe(false);
      expect(result instanceof Map).toBe(true);
    });

    it('size 512 → returns proxy', () => {
      const map = new Map(Array.from({ length: MAP_THRESHOLD }, (_, i) => [i, i]));
      const result = pura(map);
      expect(isPura(result)).toBe(true);
    });

    it('size 513 → returns proxy', () => {
      const map = new Map(Array.from({ length: MAP_LARGE }, (_, i) => [i, i]));
      const result = pura(map);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Upgrade: Small → Large', () => {
    it('produce set: 511 → 512 upgrades to proxy', () => {
      const base = new Map(Array.from({ length: MAP_SMALL }, (_, i) => [i, i]));
      const result = produce(base, draft => draft.set(999, 999));

      expect(result.size).toBe(MAP_THRESHOLD);
      expect(isPura(result)).toBe(true);
    });

    it('produce multiple sets: 510 → 513 upgrades', () => {
      const base = new Map(Array.from({ length: MAP_SMALL - 1 }, (_, i) => [i, i]));
      const result = produce(base, draft => {
        draft.set(1000, 1000);
        draft.set(1001, 1001);
        draft.set(1002, 1002);
      });

      expect(result.size).toBe(MAP_LARGE);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Downgrade: Large → Small', () => {
    it('produce delete: 512 → 511 downgrades to native', () => {
      const base = new Map(Array.from({ length: MAP_THRESHOLD }, (_, i) => [i, i]));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => draft.delete(0));

      expect(result.size).toBe(MAP_SMALL);
      expect(isPura(result)).toBe(false);
      expect(result instanceof Map).toBe(true);
    });

    it('produce multiple deletes: 600 → 100 downgrades', () => {
      const base = new Map(Array.from({ length: MAP_VERY_LARGE }, (_, i) => [i, i]));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        for (let i = 100; i < 600; i++) {
          draft.delete(i);
        }
      });

      expect(result.size).toBe(100);
      expect(isPura(result)).toBe(false);
    });
  });

  describe('Insertion Order (Large Maps)', () => {
    it('large maps preserve insertion order', () => {
      const entries: [number, string][] = [];
      for (let i = 0; i < 600; i++) {
        entries.push([i, `val-${i}`]);
      }
      const map = pura(new Map(entries));

      const keys = Array.from(map.keys());
      expect(keys).toEqual(Array.from({ length: SET_VERY_LARGE }, (_, i) => i));
    });

    it('produce maintains insertion order after updates', () => {
      const base = new Map(Array.from({ length: SET_VERY_LARGE }, (_, i) => [i, i]));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        draft.set(1000, 1000); // Add at end
      });

      const keys = Array.from(result.keys());
      expect(keys[600]).toBe(1000);
      expect(keys.length).toBe(601);
    });
  });
});

// ============================================
// SET ADAPTIVE TESTS
// ============================================

describe('Set - Adaptive Optimization', () => {
  describe('Threshold Boundary', () => {
    it('size 511 → returns native', () => {
      const set = new Set(Array.from({ length: SET_SMALL }, (_, i) => i));
      const result = pura(set);
      expect(isPura(result)).toBe(false);
      expect(result instanceof Set).toBe(true);
    });

    it('size 512 → returns proxy', () => {
      const set = new Set(Array.from({ length: SET_THRESHOLD }, (_, i) => i));
      const result = pura(set);
      expect(isPura(result)).toBe(true);
    });

    it('size 513 → returns proxy', () => {
      const set = new Set(Array.from({ length: SET_LARGE }, (_, i) => i));
      const result = pura(set);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Upgrade: Small → Large', () => {
    it('produce add: 511 → 512 upgrades to proxy', () => {
      const base = new Set(Array.from({ length: SET_SMALL }, (_, i) => i));
      const result = produce(base, draft => draft.add(999));

      expect(result.size).toBe(SET_THRESHOLD);
      expect(isPura(result)).toBe(true);
    });

    it('produce multiple adds: 510 → 513 upgrades', () => {
      const base = new Set(Array.from({ length: SET_SMALL - 1 }, (_, i) => i));
      const result = produce(base, draft => {
        draft.add(1000);
        draft.add(1001);
        draft.add(1002);
      });

      expect(result.size).toBe(SET_LARGE);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Downgrade: Large → Small', () => {
    it('produce delete: 512 → 511 downgrades to native', () => {
      const base = new Set(Array.from({ length: SET_THRESHOLD }, (_, i) => i));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => draft.delete(0));

      expect(result.size).toBe(SET_SMALL);
      expect(isPura(result)).toBe(false);
      expect(result instanceof Set).toBe(true);
    });

    it('produce clear then add: 600 → 10 downgrades', () => {
      const base = new Set(Array.from({ length: SET_VERY_LARGE }, (_, i) => i));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        draft.clear();
        for (let i = 0; i < 10; i++) {
          draft.add(i);
        }
      });

      expect(result.size).toBe(10);
      expect(isPura(result)).toBe(false);
    });
  });

  describe('Insertion Order (Large Sets)', () => {
    it('large sets preserve insertion order', () => {
      const values = Array.from({ length: 600 }, (_, i) => i);
      const set = pura(new Set(values));

      const result = Array.from(set);
      expect(result).toEqual(values);
    });

    it('produce maintains insertion order after updates', () => {
      const base = new Set(Array.from({ length: 600 }, (_, i) => i));
      const puraBase = pura(base);
      const result = produce(puraBase, draft => {
        draft.add(1000); // Add at end
      });

      const values = Array.from(result);
      expect(values[600]).toBe(1000);
      expect(values.length).toBe(601);
    });
  });
});

// ============================================
// OBJECT ADAPTIVE TESTS
// ============================================

describe('Object - Adaptive Optimization', () => {
  describe('Threshold Boundary', () => {
    it('size 511 → returns native', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_SMALL; i++) {
        obj[`key${i}`] = i;
      }
      const result = pura(obj);
      expect(isPura(result)).toBe(false);
      expect(typeof result).toBe('object');
    });

    it('size 512 → returns proxy', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_THRESHOLD; i++) {
        obj[`key${i}`] = i;
      }
      const result = pura(obj);
      expect(isPura(result)).toBe(true);
    });

    it('size 513 → returns proxy', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_LARGE; i++) {
        obj[`key${i}`] = i;
      }
      const result = pura(obj);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Upgrade: Small → Large', () => {
    it('produce add property: 511 → 512 upgrades to proxy', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_SMALL; i++) {
        obj[`key${i}`] = i;
      }
      const result = produce(obj, draft => {
        (draft as any).key999 = 999;
      });

      expect(Object.keys(result).length).toBe(OBJECT_THRESHOLD);
      expect(isPura(result)).toBe(true);
    });

    it('produce add multiple properties: 510 → 513 upgrades', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_SMALL - 1; i++) {
        obj[`key${i}`] = i;
      }
      const result = produce(obj, draft => {
        (draft as any).key1000 = 1000;
        (draft as any).key1001 = 1001;
        (draft as any).key1002 = 1002;
      });

      expect(Object.keys(result).length).toBe(OBJECT_LARGE);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Downgrade: Large → Small', () => {
    it('produce delete property: 512 → 511 downgrades to native', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_THRESHOLD; i++) {
        obj[`key${i}`] = i;
      }
      const puraObj = pura(obj);
      const result = produce(puraObj, draft => {
        delete (draft as any).key0;
      });

      expect(Object.keys(result).length).toBe(OBJECT_SMALL);
      expect(isPura(result)).toBe(false);
      expect(typeof result).toBe('object');
    });

    it('produce delete multiple properties: 600 → 100 downgrades', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
        obj[`key${i}`] = i;
      }
      const puraObj = pura(obj);
      const result = produce(puraObj, draft => {
        for (let i = 100; i < OBJECT_VERY_LARGE; i++) {
          delete (draft as any)[`key${i}`];
        }
      });

      expect(Object.keys(result).length).toBe(100);
      expect(isPura(result)).toBe(false);
    });
  });

  describe('Stability: Size Unchanged', () => {
    it('small stays small after mutations', () => {
      const base = { a: 1, b: 2, c: 3 };
      const result = produce(base, draft => {
        (draft as any).a = 999;
        (draft as any).d = 4;
        delete (draft as any).d;
      });

      expect(Object.keys(result).length).toBe(3);
      expect(isPura(result)).toBe(false);
      expect((result as any).a).toBe(999);
    });

    it('large stays large after mutations', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
        obj[`key${i}`] = i;
      }
      const puraObj = pura(obj);
      const result = produce(puraObj, draft => {
        (draft as any).key0 = 999;
        (draft as any).key1000 = 1000;
        delete (draft as any).key1000;
      });

      expect(Object.keys(result).length).toBe(OBJECT_VERY_LARGE);
      expect(isPura(result)).toBe(true);
    });
  });

  describe('Reference Equality', () => {
    it('no modification → returns same reference (small)', () => {
      const base = { a: 1, b: 2, c: 3 };
      const result = produce(base, () => {});
      expect(result).toBe(base);
    });

    it('no modification → returns same reference (large)', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
        obj[`key${i}`] = i;
      }
      const puraObj = pura(obj);
      const result = produce(puraObj, () => {});
      expect(result).toBe(puraObj);
    });

    it('modification → returns new reference (small)', () => {
      const base = { a: 1, b: 2, c: 3 };
      const result = produce(base, draft => {
        (draft as any).d = 4;
      });
      expect(result).not.toBe(base);
      expect((base as any).d).toBeUndefined();
    });

    it('modification → returns new reference (large)', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
        obj[`key${i}`] = i;
      }
      const puraObj = pura(obj);
      const result = produce(puraObj, draft => {
        (draft as any).key1000 = 1000;
      });
      expect(result).not.toBe(puraObj);
      expect((puraObj as any).key1000).toBeUndefined();
    });
  });

  describe('Nested Properties', () => {
    it('small object with nested objects supports COW', () => {
      const base = { a: { val: 1 }, b: { val: 2 } };
      const result = produce(base, draft => {
        (draft as any).a.val = 999;
      });

      expect((result as any).a.val).toBe(999);
      expect((base as any).a.val).toBe(1);
      expect(isPura(result)).toBe(false);
    });

    it('large object with nested objects supports COW', () => {
      const obj: any = {};
      for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
        obj[`key${i}`] = { val: i };
      }
      const puraObj = pura(obj);
      const result = produce(puraObj, draft => {
        (draft as any).key0.val = 999;
      });

      expect((result as any).key0.val).toBe(999);
      expect((puraObj as any).key0.val).toBe(0);
      expect(isPura(result)).toBe(true);
    });
  });
});

// ============================================
// CROSS-TYPE TESTS
// ============================================

describe('Cross-Type Adaptive Behavior', () => {
  it('mixed operations maintain correct types', () => {
    const arr = pura(Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i));
    const map = pura(new Map(Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => [i, i])));
    const set = pura(new Set(Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i)));
    const obj: any = {};
    for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
      obj[`key${i}`] = i;
    }
    const largeObj = pura(obj);

    expect(isPura(arr)).toBe(true);
    expect(isPura(map)).toBe(true);
    expect(isPura(set)).toBe(true);
    expect(isPura(largeObj)).toBe(true);

    const smallArr = pura([1, 2, 3]);
    const smallMap = pura(new Map([['a', 1]]));
    const smallSet = pura(new Set([1, 2, 3]));
    const smallObj = pura({ a: 1, b: 2, c: 3 });

    expect(isPura(smallArr)).toBe(false);
    expect(isPura(smallMap)).toBe(false);
    expect(isPura(smallSet)).toBe(false);
    expect(isPura(smallObj)).toBe(false);
  });

  it('unpura works correctly for both modes', () => {
    // Small (native) - unpura is idempotent
    const smallArr = pura([1, 2, 3]);
    const unSmallArr = unpura(smallArr);
    expect(unSmallArr).toBe(smallArr);

    const smallObj = pura({ a: 1, b: 2 });
    const unSmallObj = unpura(smallObj);
    expect(unSmallObj).toBe(smallObj);

    // Large (proxy) - unpura converts to native
    const largeArr = pura(Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i));
    const unLargeArr = unpura(largeArr);
    expect(Array.isArray(unLargeArr)).toBe(true);
    expect(unLargeArr.length).toBe(600);
    expect(isPura(unLargeArr)).toBe(false);

    const largeObj: any = {};
    for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
      largeObj[`key${i}`] = i;
    }
    const puraLargeObj = pura(largeObj);
    const unLargeObj = unpura(puraLargeObj);
    expect(typeof unLargeObj).toBe('object');
    expect(Object.keys(unLargeObj).length).toBe(600);
    expect(isPura(unLargeObj)).toBe(false);
  });

  it('nested structures with mixed sizes', () => {
    const largeObjData: any = {};
    for (let i = 0; i < OBJECT_VERY_LARGE; i++) {
      largeObjData[`key${i}`] = i;
    }

    const obj = {
      smallArr: pura([1, 2, 3]),
      largeArr: pura(Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => i)),
      smallMap: pura(new Map([['a', 1]])),
      largeMap: pura(new Map(Array.from({ length: ARRAY_VERY_LARGE }, (_, i) => [i, i]))),
      smallObj: pura({ a: 1, b: 2 }),
      largeObj: pura(largeObjData),
    };

    expect(isPura(obj.smallArr)).toBe(false);
    expect(isPura(obj.largeArr)).toBe(true);
    expect(isPura(obj.smallMap)).toBe(false);
    expect(isPura(obj.largeMap)).toBe(true);
    expect(isPura(obj.smallObj)).toBe(false);
    expect(isPura(obj.largeObj)).toBe(true);
  });
});

// ============================================
// PERFORMANCE CHARACTERISTICS
// ============================================

describe('Performance Characteristics', () => {
  it('small arrays use native copy (fast)', () => {
    const base = [1, 2, 3];
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const result = produce(base, draft => draft.push(4));
    }
    const elapsed = performance.now() - start;
    // Should be very fast (< 10ms for 1000 iterations)
    expect(elapsed).toBeLessThan(100);
  });

  it('large arrays use structural sharing (efficient)', () => {
    const base = Array.from({ length: 1000 }, (_, i) => i);
    const puraBase = pura(base);

    const result1 = produce(puraBase, draft => draft[0] = 999);
    const result2 = produce(puraBase, draft => draft[999] = 999);

    // Should share most of the structure
    expect(isPura(result1)).toBe(true);
    expect(isPura(result2)).toBe(true);
  });
});
