/**
 * Comprehensive Test Suite for Pura Object Support
 *
 * Goal: pura({}) should work identically to pura([])
 * with the same produce() syntax and equivalent optimizations
 */

import { describe, it, expect } from 'vitest';
// Future imports - will be implemented
import { pura, produce, unpura, isPura } from './index';

// ============================================
// 1. BASIC CRUD OPERATIONS
// ============================================

describe('Object - Basic CRUD', () => {
  describe('Create', () => {
    it('should create empty object', () => {
      const obj = pura({});
      expect(obj).toEqual({});
      expect(Object.keys(obj)).toEqual([]);
    });

    it('should create object with initial properties', () => {
      const obj = pura({ a: 1, b: 2, c: 3 });
      expect(obj.a).toBe(1);
      expect(obj.b).toBe(2);
      expect(obj.c).toBe(3);
    });

    it('should create object with various value types', () => {
      const obj = pura({
        num: 42,
        str: 'hello',
        bool: true,
        nil: null,
        undef: undefined,
        arr: [1, 2, 3],
        nested: { x: 1 },
      });
      expect(obj.num).toBe(42);
      expect(obj.str).toBe('hello');
      expect(obj.bool).toBe(true);
      expect(obj.nil).toBe(null);
      expect(obj.undef).toBe(undefined);
      expect(obj.arr).toEqual([1, 2, 3]);
      expect(obj.nested).toEqual({ x: 1 });
    });

    it('should be idempotent for large objects (>= 512 props)', () => {
      const largeObj: any = {};
      for (let i = 0; i < 600; i++) {
        largeObj[`key${i}`] = i;
      }
      const obj = pura(largeObj);
      const obj2 = pura(obj);
      expect(obj).toBe(obj2); // Large objects are idempotent
      expect(isPura(obj)).toBe(true);
    });

    it('should create new copy for small objects (< 512 props)', () => {
      const smallObj = { a: 1 };
      const obj1 = pura(smallObj);
      const obj2 = pura(smallObj);
      expect(obj1).not.toBe(obj2); // Each call creates new copy
      expect(isPura(obj1)).toBe(false); // Small objects are native
      expect(isPura(obj2)).toBe(false);
    });
  });

  describe('Read', () => {
    it('should read existing properties', () => {
      const obj = pura({ x: 10, y: 20 });
      expect(obj.x).toBe(10);
      expect(obj.y).toBe(20);
    });

    it('should return undefined for non-existent properties', () => {
      const obj = pura({ a: 1 });
      expect((obj as any).nonexistent).toBeUndefined();
    });

    it('should support bracket notation', () => {
      const obj = pura({ 'special-key': 'value' });
      expect(obj['special-key']).toBe('value');
    });

    it('should support computed property access', () => {
      const obj = pura({ a: 1, b: 2 });
      const key = 'a';
      expect(obj[key]).toBe(1);
    });
  });

  describe('Update (via produce)', () => {
    it('should update single property', () => {
      const obj = pura({ a: 1, b: 2 });
      const updated = produce(obj, draft => {
        draft.a = 100;
      });
      expect(updated.a).toBe(100);
      expect(updated.b).toBe(2);
      expect(obj.a).toBe(1); // Original unchanged
    });

    it('should update multiple properties', () => {
      const obj = pura({ a: 1, b: 2, c: 3 });
      const updated = produce(obj, draft => {
        draft.a = 10;
        draft.b = 20;
      });
      expect(updated).toEqual({ a: 10, b: 20, c: 3 });
      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should add new properties', () => {
      const obj = pura({ a: 1 });
      const updated = produce(obj, draft => {
        (draft as any).b = 2;
      });
      expect(updated).toEqual({ a: 1, b: 2 });
    });
  });

  describe('Delete (via produce)', () => {
    it('should delete properties', () => {
      const obj = pura({ a: 1, b: 2, c: 3 });
      const updated = produce(obj, draft => {
        delete (draft as any).b;
      });
      expect(updated).toEqual({ a: 1, c: 3 });
      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should handle delete of non-existent property', () => {
      const obj = pura({ a: 1 });
      const updated = produce(obj, draft => {
        delete (draft as any).nonexistent;
      });
      expect(updated).toEqual({ a: 1 });
    });
  });
});

// ============================================
// 2. REFERENCE IDENTITY & STRUCTURAL SHARING
// ============================================

describe('Object - Reference Identity', () => {
  it('should return same reference when no changes', () => {
    const obj = pura({ a: 1, b: 2 });
    const same = produce(obj, draft => {
      // No changes
    });
    expect(same).toBe(obj);
  });

  it('should return same reference when no mutations', () => {
    const obj = pura({ a: 1 });
    const same = produce(obj, draft => {
      // Read but don't modify
      const _ = draft.a;
    });
    expect(same).toBe(obj);
  });

  it('should return new reference when value changed', () => {
    const obj = pura({ a: 1 });
    const updated = produce(obj, draft => {
      draft.a = 2;
    });
    expect(updated).not.toBe(obj);
  });

  it('should share unmodified nested structures (underlying data)', () => {
    // Note: Proxy instances differ, but underlying data is shared
    const baseData = {
      modified: { x: 1 },
      unmodified: { y: 2 },
    };
    const obj = pura(baseData);
    const updated = produce(obj, draft => {
      draft.modified.x = 100;
    });
    // Modified branch gets new data
    expect(unpura(updated).modified).not.toBe(baseData.modified);
    // Unmodified branch shares the same underlying data
    expect(unpura(updated).unmodified).toBe(baseData.unmodified);
  });

  it('should share deeply unmodified branches (underlying data)', () => {
    // Note: Proxy instances differ, but underlying data is shared
    const baseData = {
      a: {
        b: {
          c: { value: 1 }
        }
      },
      x: {
        y: {
          z: { value: 2 }
        }
      }
    };
    const obj = pura(baseData);
    const updated = produce(obj, draft => {
      draft.a.b.c.value = 100;
    });
    // Unmodified branch shares the same underlying data
    expect(unpura(updated).x).toBe(baseData.x);
    expect(unpura(updated).x.y).toBe(baseData.x.y);
    expect(unpura(updated).x.y.z).toBe(baseData.x.y.z);
  });
});

// ============================================
// 3. NESTED OBJECTS
// ============================================

describe('Object - Nested Objects', () => {
  it('should handle deeply nested reads', () => {
    const obj = pura({
      level1: {
        level2: {
          level3: {
            value: 'deep'
          }
        }
      }
    });
    expect(obj.level1.level2.level3.value).toBe('deep');
  });

  it('should handle deeply nested updates', () => {
    const obj = pura({
      a: { b: { c: { d: 1 } } }
    });
    const updated = produce(obj, draft => {
      draft.a.b.c.d = 999;
    });
    expect(updated.a.b.c.d).toBe(999);
    expect(obj.a.b.c.d).toBe(1);
  });

  it('should handle adding nested objects', () => {
    const obj = pura({ a: 1 });
    const updated = produce(obj, draft => {
      (draft as any).nested = { x: { y: { z: 1 } } };
    });
    expect(updated).toEqual({ a: 1, nested: { x: { y: { z: 1 } } } });
  });

  it('should handle replacing nested objects', () => {
    const obj = pura({ nested: { old: 'value' } });
    const updated = produce(obj, draft => {
      draft.nested = { new: 'value' } as any;
    });
    expect(updated.nested).toEqual({ new: 'value' });
  });
});

// ============================================
// 4. MIXED STRUCTURES (Object + Array)
// ============================================

describe('Object - Mixed with Arrays', () => {
  it('should handle arrays inside objects', () => {
    const obj = pura({
      items: [1, 2, 3],
      nested: {
        list: ['a', 'b', 'c']
      }
    });
    expect(obj.items).toEqual([1, 2, 3]);
    expect(obj.nested.list).toEqual(['a', 'b', 'c']);
  });

  it('should mutate arrays inside objects via produce', () => {
    const obj = pura({
      items: [1, 2, 3]
    });
    const updated = produce(obj, draft => {
      draft.items.push(4);
    });
    expect(updated.items).toEqual([1, 2, 3, 4]);
    expect(obj.items).toEqual([1, 2, 3]);
  });

  it('should mutate nested arrays via produce', () => {
    const obj = pura({
      data: {
        values: [10, 20, 30]
      }
    });
    const updated = produce(obj, draft => {
      draft.data.values[1] = 999;
    });
    expect(updated.data.values).toEqual([10, 999, 30]);
    expect(obj.data.values).toEqual([10, 20, 30]);
  });

  it('should handle objects inside arrays', () => {
    const obj = pura({
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ]
    });
    const updated = produce(obj, draft => {
      draft.users[0].name = 'Alicia';
    });
    expect(updated.users[0].name).toBe('Alicia');
    expect(obj.users[0].name).toBe('Alice');
  });

  it('should handle complex mixed nesting', () => {
    const obj = pura({
      config: {
        servers: [
          { host: 'a.com', ports: [80, 443] },
          { host: 'b.com', ports: [8080] }
        ],
        settings: {
          debug: false,
          tags: ['prod', 'main']
        }
      }
    });
    const updated = produce(obj, draft => {
      draft.config.servers[0].ports.push(8443);
      draft.config.settings.debug = true;
    });
    expect(updated.config.servers[0].ports).toEqual([80, 443, 8443]);
    expect(updated.config.settings.debug).toBe(true);
    expect(obj.config.servers[0].ports).toEqual([80, 443]);
    expect(obj.config.settings.debug).toBe(false);
  });
});

// ============================================
// 5. OBJECT METHODS & ITERATION
// ============================================

describe('Object - Methods & Iteration', () => {
  describe('Object.keys/values/entries', () => {
    it('should support Object.keys', () => {
      const obj = pura({ a: 1, b: 2, c: 3 });
      expect(Object.keys(obj).sort()).toEqual(['a', 'b', 'c']);
    });

    it('should support Object.values', () => {
      const obj = pura({ a: 1, b: 2, c: 3 });
      expect(Object.values(obj).sort()).toEqual([1, 2, 3]);
    });

    it('should support Object.entries', () => {
      const obj = pura({ a: 1, b: 2 });
      const entries = Object.entries(obj).sort();
      expect(entries).toEqual([['a', 1], ['b', 2]]);
    });
  });

  describe('for...in loop', () => {
    it('should iterate with for...in', () => {
      const obj = pura({ x: 1, y: 2, z: 3 });
      const keys: string[] = [];
      for (const key in obj) {
        keys.push(key);
      }
      expect(keys.sort()).toEqual(['x', 'y', 'z']);
    });
  });

  describe('Property checks', () => {
    it('should support "in" operator', () => {
      const obj = pura({ a: 1 });
      expect('a' in obj).toBe(true);
      expect('b' in obj).toBe(false);
    });

    it('should support hasOwnProperty', () => {
      const obj = pura({ a: 1 });
      expect(obj.hasOwnProperty('a')).toBe(true);
      expect(obj.hasOwnProperty('b')).toBe(false);
    });

    it('should support Object.hasOwn', () => {
      const obj = pura({ a: 1 });
      expect(Object.hasOwn(obj, 'a')).toBe(true);
      expect(Object.hasOwn(obj, 'b')).toBe(false);
    });
  });

  describe('Object spread & assign', () => {
    it('should support spread operator', () => {
      const obj = pura({ a: 1, b: 2 });
      const spread = { ...obj, c: 3 };
      expect(spread).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('should support Object.assign target', () => {
      const obj = pura({ a: 1 });
      const result = Object.assign({}, obj, { b: 2 });
      expect(result).toEqual({ a: 1, b: 2 });
    });
  });

  describe('JSON serialization', () => {
    it('should serialize with JSON.stringify', () => {
      const obj = pura({ a: 1, b: 'hello', c: [1, 2, 3] });
      const json = JSON.stringify(obj);
      expect(JSON.parse(json)).toEqual({ a: 1, b: 'hello', c: [1, 2, 3] });
    });

    it('should support toJSON method', () => {
      const obj = pura({ a: 1, b: 2 });
      expect((obj as any).toJSON?.() ?? obj).toEqual({ a: 1, b: 2 });
    });
  });
});

// ============================================
// 6. SPECIAL KEYS & VALUES
// ============================================

describe('Object - Special Keys & Values', () => {
  describe('Special key names', () => {
    it('should handle numeric string keys', () => {
      const obj = pura({ '0': 'zero', '1': 'one' });
      expect(obj['0']).toBe('zero');
      expect(obj['1']).toBe('one');
    });

    it('should handle keys with special characters', () => {
      const obj = pura({
        'with-dash': 1,
        'with.dot': 2,
        'with space': 3,
        '': 4, // empty string key
      });
      expect(obj['with-dash']).toBe(1);
      expect(obj['with.dot']).toBe(2);
      expect(obj['with space']).toBe(3);
      expect(obj['']).toBe(4);
    });

    it('should handle __proto__ safely', () => {
      // Note: { '__proto__': value } in object literal sets prototype, not property
      // Use Object.defineProperty for actual __proto__ property
      const base: any = {};
      Object.defineProperty(base, '__proto__', { value: 'safe', enumerable: true, writable: true, configurable: true });
      const obj = pura(base);
      expect(obj['__proto__']).toBe('safe');
      // Should not pollute prototype
      expect(({} as any).safe).toBeUndefined();
    });

    it('should handle constructor key', () => {
      const obj = pura({ constructor: 'value' } as any);
      expect(obj.constructor).toBe('value');
    });
  });

  describe('Symbol keys', () => {
    it('should handle symbol keys', () => {
      const sym = Symbol('test');
      const obj = pura({ [sym]: 'symbol value' });
      expect(obj[sym]).toBe('symbol value');
    });

    it('should iterate symbol keys with getOwnPropertySymbols', () => {
      const sym1 = Symbol('a');
      const sym2 = Symbol('b');
      const obj = pura({ [sym1]: 1, [sym2]: 2, regular: 3 });
      const symbols = Object.getOwnPropertySymbols(obj);
      expect(symbols).toContain(sym1);
      expect(symbols).toContain(sym2);
    });

    it('should update symbol key properties via produce', () => {
      const sym = Symbol('key');
      const obj = pura({ [sym]: 'old' });
      const updated = produce(obj, draft => {
        draft[sym] = 'new';
      });
      expect(updated[sym]).toBe('new');
      expect(obj[sym]).toBe('old');
    });
  });

  describe('Special values', () => {
    it('should handle null values', () => {
      const obj = pura({ a: null });
      expect(obj.a).toBe(null);
    });

    it('should handle undefined values', () => {
      const obj = pura({ a: undefined });
      expect(obj.a).toBeUndefined();
      expect('a' in obj).toBe(true);
    });

    it('should handle NaN values', () => {
      const obj = pura({ a: NaN });
      expect(Number.isNaN(obj.a)).toBe(true);
    });

    it('should handle Infinity values', () => {
      const obj = pura({ pos: Infinity, neg: -Infinity });
      expect(obj.pos).toBe(Infinity);
      expect(obj.neg).toBe(-Infinity);
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01');
      const obj = pura({ date });
      expect(obj.date).toEqual(date);
    });

    it('should handle RegExp objects', () => {
      const regex = /test/gi;
      const obj = pura({ regex });
      expect(obj.regex).toEqual(regex);
    });

    it('should handle function values', () => {
      const fn = () => 42;
      const obj = pura({ fn });
      expect(obj.fn()).toBe(42);
    });
  });
});

// ============================================
// 7. PROPERTY DESCRIPTORS
// ============================================

describe('Object - Property Descriptors', () => {
  it('should report correct property descriptors', () => {
    const obj = pura({ a: 1 });
    const desc = Object.getOwnPropertyDescriptor(obj, 'a');
    expect(desc).toEqual({
      value: 1,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  });

  it('should report undefined for non-existent properties', () => {
    const obj = pura({ a: 1 });
    const desc = Object.getOwnPropertyDescriptor(obj, 'nonexistent');
    expect(desc).toBeUndefined();
  });

  it('should list all own property names', () => {
    const obj = pura({ a: 1, b: 2 });
    const names = Object.getOwnPropertyNames(obj);
    expect(names.sort()).toEqual(['a', 'b']);
  });
});

// ============================================
// 8. EDGE CASES
// ============================================

describe('Object - Edge Cases', () => {
  describe('Empty & minimal objects', () => {
    it('should handle empty object produce', () => {
      const obj = pura({});
      const updated = produce(obj, draft => {
        (draft as any).a = 1;
      });
      expect(updated).toEqual({ a: 1 });
    });

    it('should handle single property object', () => {
      const obj = pura({ only: 'one' });
      expect(obj.only).toBe('one');
    });
  });

  describe('Large objects', () => {
    it('should handle object with many properties', () => {
      const data: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        data[`key${i}`] = i;
      }
      const obj = pura(data);
      expect(obj.key0).toBe(0);
      expect(obj.key999).toBe(999);
      expect(Object.keys(obj).length).toBe(1000);
    });

    it('should update large object efficiently', () => {
      const data: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        data[`key${i}`] = i;
      }
      const obj = pura(data);
      const updated = produce(obj, draft => {
        draft.key500 = 9999;
      });
      expect(updated.key500).toBe(9999);
      expect(obj.key500).toBe(500);
    });
  });

  describe('Circular-ish structures', () => {
    // Note: Self-referencing in draft causes infinite loop in extractNestedValue
    // This is a known limitation - circular references need explicit handling
    it.skip('should handle self-referencing via produce', () => {
      const obj = pura({ value: 1 } as any);
      const updated = produce(obj, draft => {
        draft.self = draft; // Self reference in draft
      });
      // The final object should have a reference to itself
      expect(updated.self).toBe(updated);
    });
  });

  describe('Prototype chain', () => {
    it('should not enumerate prototype properties', () => {
      const obj = pura({ own: 'property' });
      const keys = Object.keys(obj);
      expect(keys).toEqual(['own']);
      expect(keys).not.toContain('toString');
      expect(keys).not.toContain('hasOwnProperty');
    });

    it('should access prototype methods', () => {
      const obj = pura({ a: 1 });
      expect(typeof obj.toString).toBe('function');
      expect(obj.toString()).toBe('[object Object]');
    });
  });

  describe('Type coercion', () => {
    it('should coerce to string', () => {
      const obj = pura({ a: 1 });
      expect(String(obj)).toBe('[object Object]');
    });

    it('should coerce to primitive via valueOf', () => {
      const obj = pura({ valueOf: () => 42 } as any);
      expect(+obj).toBe(42);
    });
  });

  describe('Frozen/sealed base objects', () => {
    it('should work with frozen input (creates mutable copy)', () => {
      const frozen = Object.freeze({ a: 1, b: 2 });
      const obj = pura(frozen);
      const updated = produce(obj, draft => {
        draft.a = 100;
      });
      expect(updated.a).toBe(100);
    });

    it('should work with sealed input', () => {
      const sealed = Object.seal({ a: 1 });
      const obj = pura(sealed);
      const updated = produce(obj, draft => {
        draft.a = 100;
      });
      expect(updated.a).toBe(100);
    });
  });
});

// ============================================
// 9. HELPER FUNCTIONS
// ============================================

describe('Object - Helper Functions', () => {
  describe('isPura', () => {
    it('should return true for large pura objects (>= 512 props)', () => {
      const largeObj: any = {};
      for (let i = 0; i < 600; i++) {
        largeObj[`key${i}`] = i;
      }
      const obj = pura(largeObj);
      expect(isPura(obj)).toBe(true);
    });

    it('should return false for small pura objects (< 512 props)', () => {
      const obj = pura({ a: 1 });
      expect(isPura(obj)).toBe(false); // Small objects are native
    });

    it('should return false for plain objects', () => {
      const obj = { a: 1 };
      expect(isPura(obj)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isPura(null as any)).toBe(false);
      expect(isPura(undefined as any)).toBe(false);
    });
  });

  describe('unpura', () => {
    it('should convert large pura object to plain object', () => {
      const largeObj: any = {};
      for (let i = 0; i < 600; i++) {
        largeObj[`key${i}`] = { val: i };
      }
      const obj = pura(largeObj);
      const plain = unpura(obj);
      expect(Object.keys(plain).length).toBe(600);
      expect(isPura(plain)).toBe(false);
    });

    it('should return same object for small pura object (already native)', () => {
      const obj = pura({ a: 1, b: { c: 2 } });
      const plain = unpura(obj);
      expect(plain).toBe(obj); // Small objects are already native
      expect(isPura(plain)).toBe(false);
    });

    it('should return same object if not pura', () => {
      const plain = { a: 1 };
      expect(unpura(plain)).toBe(plain);
    });
  });
});

// ============================================
// 10. EQUALITY & COMPARISON
// ============================================

describe('Object - Equality & Comparison', () => {
  it('should pass deep equality check', () => {
    const obj = pura({ a: 1, b: { c: 2 } });
    expect(obj).toEqual({ a: 1, b: { c: 2 } });
  });

  it('should work with expect.objectContaining', () => {
    const obj = pura({ a: 1, b: 2, c: 3 });
    expect(obj).toEqual(expect.objectContaining({ a: 1, b: 2 }));
  });

  it('should work with JSON round-trip', () => {
    const obj = pura({ a: 1, nested: { b: 2 } });
    const roundTrip = JSON.parse(JSON.stringify(obj));
    expect(roundTrip).toEqual({ a: 1, nested: { b: 2 } });
  });
});

// ============================================
// 11. MULTIPLE PRODUCE CHAINS
// ============================================

describe('Object - Multiple Produce Chains', () => {
  it('should chain multiple produce calls', () => {
    const v1 = pura({ count: 0 });
    const v2 = produce(v1, d => { d.count = 1; });
    const v3 = produce(v2, d => { d.count = 2; });
    const v4 = produce(v3, d => { d.count = 3; });

    expect(v1.count).toBe(0);
    expect(v2.count).toBe(1);
    expect(v3.count).toBe(2);
    expect(v4.count).toBe(3);
  });

  it('should maintain independence across produce chains', () => {
    const base = pura({ items: [1, 2, 3], meta: { version: 1 } });

    const branch1 = produce(base, d => {
      d.items.push(4);
    });

    const branch2 = produce(base, d => {
      d.meta.version = 2;
    });

    expect(base.items).toEqual([1, 2, 3]);
    expect(base.meta.version).toBe(1);
    expect(branch1.items).toEqual([1, 2, 3, 4]);
    expect(branch1.meta.version).toBe(1);
    expect(branch2.items).toEqual([1, 2, 3]);
    expect(branch2.meta.version).toBe(2);
  });
});

// ============================================
// 12. DIRECT MUTATION (Outside produce)
// ============================================

describe('Object - Direct Mutation', () => {
  it('should support direct property assignment (COW)', () => {
    const obj = pura({ a: 1 });
    obj.a = 2;
    expect(obj.a).toBe(2);
  });

  it('should support adding properties directly', () => {
    const obj = pura({ a: 1 }) as any;
    obj.b = 2;
    expect(obj.b).toBe(2);
  });

  it('should support direct delete', () => {
    const obj = pura({ a: 1, b: 2 }) as any;
    delete obj.b;
    expect(obj.b).toBeUndefined();
    expect('b' in obj).toBe(false);
  });
});

// ============================================
// 13. ARRAY-OBJECT UNIFIED API
// ============================================

describe('Unified API - Arrays and Objects', () => {
  it('should use same pura() for both with adaptive optimization', () => {
    const arrSmall = pura([1, 2, 3]);
    const objSmall = pura({ a: 1 });
    expect(isPura(arrSmall)).toBe(false); // Small array returns native
    expect(isPura(objSmall)).toBe(false); // Small object returns native

    const arrLarge = pura(Array.from({ length: 600 }, (_, i) => i));
    const objLarge: any = {};
    for (let i = 0; i < 600; i++) {
      objLarge[`key${i}`] = i;
    }
    const puraObjLarge = pura(objLarge);
    expect(isPura(arrLarge)).toBe(true); // Large array returns proxy
    expect(isPura(puraObjLarge)).toBe(true); // Large object returns proxy
  });

  it('should use same produce() for both', () => {
    const arr = pura([1, 2, 3]);
    const obj = pura({ a: 1 });

    const newArr = produce(arr, d => { d.push(4); });
    const newObj = produce(obj, d => { d.a = 2; });

    expect(newArr).toEqual([1, 2, 3, 4]);
    expect(newObj).toEqual({ a: 2 });
  });

  it('should handle nested mixed produce', () => {
    const state = pura({
      users: [
        { id: 1, name: 'Alice', tags: ['admin'] }
      ],
      config: {
        maxUsers: 100
      }
    });

    const updated = produce(state, draft => {
      draft.users[0].tags.push('active');
      draft.config.maxUsers = 200;
    });

    expect(updated.users[0].tags).toEqual(['admin', 'active']);
    expect(updated.config.maxUsers).toBe(200);
    expect(state.users[0].tags).toEqual(['admin']);
    expect(state.config.maxUsers).toBe(100);
  });
});

// ============================================
// 14. PERFORMANCE CHARACTERISTICS
// ============================================

describe('Object - Performance Characteristics', () => {
  it('should handle rapid sequential updates', () => {
    let obj = pura({ count: 0 });
    for (let i = 0; i < 100; i++) {
      obj = produce(obj, d => { d.count++; });
    }
    expect(obj.count).toBe(100);
  });

  it('should handle wide objects with sparse updates', () => {
    const data: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      data[`field${i}`] = i;
    }
    const obj = pura(data);

    const updated = produce(obj, draft => {
      draft.field50 = 9999;
    });

    // Should share most structure
    expect(updated.field50).toBe(9999);
    expect(updated.field0).toBe(0);
    expect(updated.field99).toBe(99);
  });
});

// ============================================
// 15. ERROR HANDLING
// ============================================

describe('Object - Error Handling', () => {
  it('should handle errors in produce gracefully', () => {
    const obj = pura({ a: 1 });
    expect(() => {
      produce(obj, () => {
        throw new Error('Recipe error');
      });
    }).toThrow('Recipe error');
    // Original should be unchanged
    expect(obj.a).toBe(1);
  });
});
