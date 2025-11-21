/**
 * Comprehensive Test Suite for Pura Set Support
 *
 * Goal: pura(new Set()) should work with produce()
 * with structural sharing and immutable updates
 */

import { describe, it, expect } from 'vitest';
import { pura, produce, unpura, isPura } from './index';

// ============================================
// 1. BASIC CRUD OPERATIONS
// ============================================

describe('Set - Basic CRUD', () => {
  describe('Create', () => {
    it('should create empty set', () => {
      const set = pura(new Set());
      expect(set.size).toBe(0);
    });

    it('should create set with initial values', () => {
      const set = pura(new Set([1, 2, 3]));
      expect(set.has(1)).toBe(true);
      expect(set.has(2)).toBe(true);
      expect(set.has(3)).toBe(true);
      expect(set.size).toBe(3);
    });

    it('should create set with various value types', () => {
      const objVal = { id: 1 };
      const set = pura(new Set<any>([
        'string',
        42,
        true,
        null,
        objVal,
      ]));
      expect(set.has('string')).toBe(true);
      expect(set.has(42)).toBe(true);
      expect(set.has(true)).toBe(true);
      expect(set.has(null)).toBe(true);
      expect(set.has(objVal)).toBe(true);
    });

    it('should deduplicate values', () => {
      const set = pura(new Set([1, 2, 2, 3, 3, 3]));
      expect(set.size).toBe(3);
    });

    it('small sets return native (adaptive)', () => {
      const set = pura(new Set([1, 2, 3]));
      expect(isPura(set)).toBe(false); // Small sets return native
    });

    it('large sets are idempotent', () => {
      const largeSet = new Set(Array.from({ length: 600 }, (_, i) => i));
      const set = pura(largeSet);
      const set2 = pura(set);
      expect(set).toBe(set2);
      expect(isPura(set)).toBe(true);
    });
  });

  describe('Read', () => {
    it('should check value existence with has()', () => {
      const set = pura(new Set([1, 2, 3]));
      expect(set.has(1)).toBe(true);
      expect(set.has(2)).toBe(true);
      expect(set.has(4)).toBe(false);
    });

    it('should return correct size', () => {
      const set = pura(new Set([1, 2, 3, 4, 5]));
      expect(set.size).toBe(5);
    });
  });

  describe('Add (via produce)', () => {
    it('should add single value', () => {
      const set = pura(new Set([1, 2]));
      const updated = produce(set, draft => {
        draft.add(3);
      });
      expect(updated.has(3)).toBe(true);
      expect(updated.size).toBe(3);
      expect(set.has(3)).toBe(false);
      expect(set.size).toBe(2);
    });

    it('should add multiple values', () => {
      const set = pura(new Set([1]));
      const updated = produce(set, draft => {
        draft.add(2);
        draft.add(3);
        draft.add(4);
      });
      expect(updated.size).toBe(4);
      expect(set.size).toBe(1);
    });

    it('should not increase size for duplicate add', () => {
      const set = pura(new Set([1, 2, 3]));
      const updated = produce(set, draft => {
        draft.add(2); // Already exists
      });
      expect(updated.size).toBe(3);
    });
  });

  describe('Delete (via produce)', () => {
    it('should delete values', () => {
      const set = pura(new Set([1, 2, 3]));
      const updated = produce(set, draft => {
        draft.delete(2);
      });
      expect(updated.has(2)).toBe(false);
      expect(updated.size).toBe(2);
      expect(set.has(2)).toBe(true);
      expect(set.size).toBe(3);
    });

    it('should handle delete of non-existent value', () => {
      const set = pura(new Set([1, 2]));
      const updated = produce(set, draft => {
        draft.delete(999);
      });
      expect(updated.size).toBe(2);
    });

    it('should clear all values', () => {
      const set = pura(new Set([1, 2, 3]));
      const updated = produce(set, draft => {
        draft.clear();
      });
      expect(updated.size).toBe(0);
      expect(set.size).toBe(3);
    });
  });
});

// ============================================
// 2. REFERENCE IDENTITY & STRUCTURAL SHARING
// ============================================

describe('Set - Reference Identity', () => {
  it('should return same reference when no changes', () => {
    const set = pura(new Set([1, 2, 3]));
    const same = produce(set, draft => {
      // No changes
    });
    expect(same).toBe(set);
  });

  it('should return same reference when adding existing value', () => {
    const set = pura(new Set([1, 2, 3]));
    const same = produce(set, draft => {
      draft.add(1); // Already exists
    });
    expect(same).toBe(set);
  });

  it('should return new reference when value added', () => {
    const set = pura(new Set([1, 2]));
    const updated = produce(set, draft => {
      draft.add(3);
    });
    expect(updated).not.toBe(set);
  });

  it('should return new reference when value deleted', () => {
    const set = pura(new Set([1, 2, 3]));
    const updated = produce(set, draft => {
      draft.delete(2);
    });
    expect(updated).not.toBe(set);
  });
});

// ============================================
// 3. NESTED STRUCTURES
// ============================================

describe('Set - Nested Structures', () => {
  it('should handle sets inside objects', () => {
    const obj = pura({
      tags: pura(new Set(['a', 'b', 'c']))
    });
    expect(obj.tags.has('a')).toBe(true);
    expect(obj.tags.size).toBe(3);
  });

  it('should update sets inside objects via produce', () => {
    // For nested Set updates, update the Set via produce and assign it
    const obj = pura({
      tags: pura(new Set(['a', 'b']))
    });
    const updated = produce(obj, draft => {
      draft.tags = produce(draft.tags, d => d.add('c'));
    });
    expect(updated.tags.has('c')).toBe(true);
    expect(updated.tags.size).toBe(3);
    expect(obj.tags.has('c')).toBe(false);
    expect(obj.tags.size).toBe(2);
  });

  it('should handle sets inside arrays', () => {
    const arr = pura([
      pura(new Set([1, 2])),
      pura(new Set([3, 4]))
    ]);
    const updated = produce(arr, draft => {
      draft[0] = produce(draft[0], d => d.add(100));
    });
    expect(updated[0].has(100)).toBe(true);
    expect(arr[0].has(100)).toBe(false);
  });

  it('should handle objects inside sets', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const set = pura(new Set([obj1, obj2]));
    expect(set.has(obj1)).toBe(true);
    expect(set.has(obj2)).toBe(true);
    expect(set.has({ id: 1 })).toBe(false); // Different reference
  });

  it('should handle sets inside maps', () => {
    const map = pura(new Map([
      ['users', pura(new Set(['alice', 'bob']))]
    ]));
    const updated = produce(map, draft => {
      const users = draft.get('users');
      if (users) {
        draft.set('users', produce(users, d => d.add('charlie')));
      }
    });
    expect(updated.get('users')?.has('charlie')).toBe(true);
    expect(map.get('users')?.has('charlie')).toBe(false);
  });
});

// ============================================
// 4. ITERATION
// ============================================

describe('Set - Iteration', () => {
  it('should iterate with forEach', () => {
    const set = pura(new Set([1, 2, 3]));
    const values: number[] = [];
    set.forEach(value => {
      values.push(value);
    });
    expect(values.sort()).toEqual([1, 2, 3]);
  });

  it('should iterate with for...of', () => {
    const set = pura(new Set(['a', 'b', 'c']));
    const values: string[] = [];
    for (const value of set) {
      values.push(value);
    }
    expect(values.sort()).toEqual(['a', 'b', 'c']);
  });

  it('should support values()', () => {
    const set = pura(new Set([1, 2, 3]));
    const values = [...set.values()];
    expect(values.sort()).toEqual([1, 2, 3]);
  });

  it('should support keys() (same as values for Set)', () => {
    const set = pura(new Set([1, 2, 3]));
    const keys = [...set.keys()];
    expect(keys.sort()).toEqual([1, 2, 3]);
  });

  it('should support entries()', () => {
    const set = pura(new Set([1, 2]));
    const entries = [...set.entries()];
    expect(entries.sort()).toEqual([[1, 1], [2, 2]]);
  });

  it('should support Symbol.iterator', () => {
    const set = pura(new Set([10]));
    expect(typeof set[Symbol.iterator]).toBe('function');
    const values = [...set];
    expect(values).toEqual([10]);
  });

  it('should iterate over all values', () => {
    // Note: HAMT-based Set doesn't preserve insertion order (trade-off for O(log n) operations)
    const set = pura(new Set([3, 1, 2]));
    const values = [...set].sort((a, b) => a - b);
    expect(values).toEqual([1, 2, 3]);
  });
});

// ============================================
// 5. SPECIAL VALUE TYPES
// ============================================

describe('Set - Special Value Types', () => {
  it('should handle object values by reference', () => {
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const set = pura(new Set([obj1, obj2]));
    expect(set.has(obj1)).toBe(true);
    expect(set.has(obj2)).toBe(true);
    expect(set.has({ id: 1 })).toBe(false); // Different reference
  });

  it('should handle symbol values', () => {
    const sym = Symbol('test');
    const set = pura(new Set([sym]));
    expect(set.has(sym)).toBe(true);
  });

  it('should handle NaN', () => {
    const set = pura(new Set([NaN]));
    expect(set.has(NaN)).toBe(true);
    expect(set.size).toBe(1);
  });

  it('should handle null and undefined', () => {
    const set = pura(new Set([null, undefined]));
    expect(set.has(null)).toBe(true);
    expect(set.has(undefined)).toBe(true);
    expect(set.size).toBe(2);
  });

  it('should treat 0 and -0 as same', () => {
    const set = pura(new Set([0]));
    expect(set.has(-0)).toBe(true);
    expect(set.size).toBe(1);
  });

  it('should handle function values', () => {
    const fn = () => 42;
    const set = pura(new Set([fn]));
    expect(set.has(fn)).toBe(true);
  });
});

// ============================================
// 6. EDGE CASES
// ============================================

describe('Set - Edge Cases', () => {
  it('should handle empty set produce', () => {
    const set = pura(new Set<number>());
    const updated = produce(set, draft => {
      draft.add(1);
    });
    expect(updated.has(1)).toBe(true);
    expect(updated.size).toBe(1);
  });

  it('should handle large sets', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i);
    const set = pura(new Set(values));
    expect(set.has(0)).toBe(true);
    expect(set.has(999)).toBe(true);
    expect(set.size).toBe(1000);
  });

  it('should update large set efficiently', () => {
    const values = Array.from({ length: 1000 }, (_, i) => i);
    const set = pura(new Set(values));
    const updated = produce(set, draft => {
      draft.add(9999);
    });
    expect(updated.has(9999)).toBe(true);
    expect(updated.size).toBe(1001);
    expect(set.has(9999)).toBe(false);
    expect(set.size).toBe(1000);
  });

  it('should handle single value set', () => {
    const set = pura(new Set(['only']));
    expect(set.has('only')).toBe(true);
    expect(set.size).toBe(1);
  });
});

// ============================================
// 7. HELPER FUNCTIONS
// ============================================

describe('Set - Helper Functions', () => {
  describe('isPura', () => {
    it('should return false for small pura sets (adaptive)', () => {
      const set = pura(new Set([1, 2, 3]));
      expect(isPura(set)).toBe(false); // Small sets return native
    });

    it('should return true for large pura sets', () => {
      const largeSet = new Set(Array.from({ length: 600 }, (_, i) => i));
      const set = pura(largeSet);
      expect(isPura(set)).toBe(true);
    });

    it('should return false for plain sets', () => {
      const set = new Set([1, 2, 3]);
      expect(isPura(set)).toBe(false);
    });
  });

  describe('unpura', () => {
    it('should convert pura set to plain set', () => {
      const set = pura(new Set([1, 2, 3]));
      const plain = unpura(set);
      expect(plain instanceof Set).toBe(true);
      expect(plain.has(1)).toBe(true);
      expect(isPura(plain)).toBe(false);
    });

    it('should return same set if not pura', () => {
      const plain = new Set([1, 2]);
      expect(unpura(plain)).toBe(plain);
    });
  });
});

// ============================================
// 8. SET OPERATIONS (Union, Intersection, Difference)
// ============================================

describe('Set - Set Operations via produce', () => {
  it('should perform union via produce', () => {
    const set1 = pura(new Set([1, 2, 3]));
    const set2 = new Set([3, 4, 5]);
    const union = produce(set1, draft => {
      for (const val of set2) {
        draft.add(val);
      }
    });
    expect([...union].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('should perform intersection via produce', () => {
    const set1 = pura(new Set([1, 2, 3, 4]));
    const set2 = new Set([2, 4, 6]);
    const intersection = produce(set1, draft => {
      for (const val of draft) {
        if (!set2.has(val)) {
          draft.delete(val);
        }
      }
    });
    expect([...intersection].sort()).toEqual([2, 4]);
  });

  it('should perform difference via produce', () => {
    const set1 = pura(new Set([1, 2, 3, 4]));
    const set2 = new Set([2, 4]);
    const difference = produce(set1, draft => {
      for (const val of set2) {
        draft.delete(val);
      }
    });
    expect([...difference].sort()).toEqual([1, 3]);
  });
});

// ============================================
// 9. MULTIPLE PRODUCE CHAINS
// ============================================

describe('Set - Multiple Produce Chains', () => {
  it('should chain multiple produce calls', () => {
    const v1 = pura(new Set([1]));
    const v2 = produce(v1, d => { d.add(2); });
    const v3 = produce(v2, d => { d.add(3); });
    const v4 = produce(v3, d => { d.add(4); });

    expect(v1.size).toBe(1);
    expect(v2.size).toBe(2);
    expect(v3.size).toBe(3);
    expect(v4.size).toBe(4);
  });

  it('should maintain independence across branches', () => {
    const base = pura(new Set([1, 2]));

    const branch1 = produce(base, d => {
      d.add(3);
    });

    const branch2 = produce(base, d => {
      d.delete(1);
    });

    expect([...base].sort()).toEqual([1, 2]);
    expect([...branch1].sort()).toEqual([1, 2, 3]);
    expect([...branch2].sort()).toEqual([2]);
  });
});

// ============================================
// 10. DIRECT MUTATION (Outside produce)
// ============================================

describe('Set - Direct Mutation', () => {
  it('should support direct add (COW)', () => {
    const set = pura(new Set([1, 2]));
    set.add(3);
    expect(set.has(3)).toBe(true);
  });

  it('should support direct delete', () => {
    const set = pura(new Set([1, 2, 3]));
    set.delete(2);
    expect(set.has(2)).toBe(false);
  });

  it('should support direct clear', () => {
    const set = pura(new Set([1, 2, 3]));
    set.clear();
    expect(set.size).toBe(0);
  });
});

// ============================================
// 11. TYPE PRESERVATION
// ============================================

describe('Set - Type Preservation', () => {
  it('should preserve Set behavior', () => {
    const set = pura(new Set([1, 2, 3]));
    expect(typeof set.add).toBe('function');
    expect(typeof set.has).toBe('function');
    expect(typeof set.delete).toBe('function');
    expect(typeof set.size).toBe('number');
  });

  it('should have correct Symbol.toStringTag', () => {
    const set = pura(new Set([1]));
    expect(Object.prototype.toString.call(set)).toBe('[object Set]');
  });
});

// ============================================
// 12. ERROR HANDLING
// ============================================

describe('Set - Error Handling', () => {
  it('should handle errors in produce gracefully', () => {
    const set = pura(new Set([1, 2, 3]));
    expect(() => {
      produce(set, () => {
        throw new Error('Recipe error');
      });
    }).toThrow('Recipe error');
    expect(set.has(1)).toBe(true);
    expect(set.size).toBe(3);
  });
});

// ============================================
// 13. UNIFIED API
// ============================================

describe('Set - Unified API', () => {
  it('should use same pura() for arrays, objects, maps, and sets', () => {
    // Small collections return native
    const arrSmall = pura([1, 2, 3]);
    const mapSmall = pura(new Map([['a', 1]]));
    const setSmall = pura(new Set([1, 2, 3]));
    expect(isPura(arrSmall)).toBe(false);
    expect(isPura(mapSmall)).toBe(false);
    expect(isPura(setSmall)).toBe(false);

    // Large collections return proxy
    const arrLarge = pura(Array.from({ length: 600 }, (_, i) => i));
    const mapLarge = pura(new Map(Array.from({ length: 600 }, (_, i) => [i, i])));
    const setLarge = pura(new Set(Array.from({ length: 600 }, (_, i) => i)));
    expect(isPura(arrLarge)).toBe(true);
    expect(isPura(mapLarge)).toBe(true);
    expect(isPura(setLarge)).toBe(true);

    // Small objects return native (adaptive)
    const objSmall = pura({ a: 1 });
    expect(isPura(objSmall)).toBe(false);

    // Large objects return proxy (adaptive)
    const objLarge: any = {};
    for (let i = 0; i < 600; i++) {
      objLarge[`key${i}`] = i;
    }
    const puraObjLarge = pura(objLarge);
    expect(isPura(puraObjLarge)).toBe(true);
  });

  it('should use same produce() for all types', () => {
    const set = pura(new Set([1, 2]));
    const updated = produce(set, draft => {
      draft.add(3);
    });
    expect([...updated].sort()).toEqual([1, 2, 3]);
  });

  it('should handle mixed nested structures', () => {
    const state = pura({
      users: new Set(['alice', 'bob']),
      metadata: new Map([['version', 1]]),
      items: [1, 2, 3]
    });

    const updated = produce(state, draft => {
      draft.users.add('charlie');
      draft.metadata.set('version', 2);
      draft.items.push(4);
    });

    expect(updated.users.has('charlie')).toBe(true);
    expect(updated.metadata.get('version')).toBe(2);
    expect(updated.items).toEqual([1, 2, 3, 4]);

    expect(state.users.has('charlie')).toBe(false);
    expect(state.metadata.get('version')).toBe(1);
    expect(state.items).toEqual([1, 2, 3]);
  });
});
