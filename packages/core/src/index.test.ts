/**
 * Tests for Pura - High-performance efficient arrays
 */

import { describe, it, expect } from 'vitest';
import { pura, produce, unpura } from './index';

describe('pura() - efficient array', () => {
  it('creates efficient array', () => {
    const arr = pura([1, 2, 3]);
    expect(arr[0]).toBe(1);
    expect(arr[1]).toBe(2);
    expect(arr[2]).toBe(3);
    expect(arr.length).toBe(3);
  });

  it('supports direct mutations - push', () => {
    const arr = pura([1, 2, 3]);
    arr.push(4);
    expect(arr[3]).toBe(4);
    expect(arr.length).toBe(4);
  });

  it('supports direct mutations - pop', () => {
    const arr = pura([1, 2, 3]);
    const popped = arr.pop();
    expect(popped).toBe(3);
    expect(arr.length).toBe(2);
  });

  it('supports direct mutations - index assignment', () => {
    const arr = pura([1, 2, 3]);
    arr[0] = 100;
    expect(arr[0]).toBe(100);
    expect(arr[1]).toBe(2);
    expect(arr[2]).toBe(3);
  });

  it('array methods work', () => {
    const arr = pura([1, 2, 3]);
    const mapped = arr.map(x => x * 2);
    expect(mapped).toEqual([2, 4, 6]);

    const filtered = arr.filter(x => x > 1);
    expect(filtered).toEqual([2, 3]);

    const sum = arr.reduce((a, b) => a + b, 0);
    expect(sum).toBe(6);
  });

  it('iteration works', () => {
    const arr = pura([1, 2, 3]);
    const result: number[] = [];
    for (const item of arr) {
      result.push(item);
    }
    expect(result).toEqual([1, 2, 3]);
  });
});

describe('produce() - immutable updates', () => {
  it('returns new array, original unchanged', () => {
    const a = pura([1, 2, 3]);
    const b = produce(a, draft => {
      draft.push(4);
    });

    expect(a.length).toBe(3);
    expect(a[0]).toBe(1);
    expect(a[1]).toBe(2);
    expect(a[2]).toBe(3);

    expect(b.length).toBe(4);
    expect(b[0]).toBe(1);
    expect(b[1]).toBe(2);
    expect(b[2]).toBe(3);
    expect(b[3]).toBe(4);

    expect(a === b).toBe(false);
  });

  it('returned array is also mutable', () => {
    const a = pura([1, 2, 3]);
    const b = produce(a, draft => {
      draft.push(4);
    });

    // b should also be mutable
    b.push(5);
    expect(b.length).toBe(5);
    expect(b[4]).toBe(5);

    // a should still be unchanged
    expect(a.length).toBe(3);
  });

  it('reference identity - no changes returns same array', () => {
    const a = pura([1, 2, 3]);
    const b = produce(a, () => {
      // No changes
    });

    expect(a === b).toBe(true);
  });

  it('supports index assignment in draft', () => {
    const a = pura([1, 2, 3]);
    const b = produce(a, draft => {
      draft[0] = 100;
    });

    expect(a[0]).toBe(1);
    expect(b[0]).toBe(100);
  });

  it('supports pop in draft', () => {
    const a = pura([1, 2, 3]);
    const b = produce(a, draft => {
      draft.pop();
    });

    expect(a.length).toBe(3);
    expect(b.length).toBe(2);
  });

  it('works with native arrays', () => {
    const native = [1, 2, 3];
    const result = produce(native, draft => {
      draft.push(4);
    });

    expect(native).toEqual([1, 2, 3]);
    expect(result.length).toBe(4);
    expect(result[3]).toBe(4);
  });
});

describe('Dual-mode behavior', () => {
  it('Mode A: Direct mutation', () => {
    const arr = pura([1, 2, 3]);

    // Direct mutations modify the same array
    arr.push(4);
    expect(arr.length).toBe(4);

    arr[0] = 100;
    expect(arr[0]).toBe(100);

    arr.pop();
    expect(arr.length).toBe(3);
  });

  it('Mode B: Immutable via produce', () => {
    const a = pura([1, 2, 3]);
    const b = produce(a, draft => {
      draft.push(4);
      draft[0] = 100;
    });

    // Original unchanged
    expect(a.length).toBe(3);
    expect(a[0]).toBe(1);

    // New array created
    expect(b.length).toBe(4);
    expect(b[0]).toBe(100);
    expect(b[3]).toBe(4);
  });

  it('Can alternate between modes', () => {
    // Start with pura
    let arr = pura([1, 2, 3]);

    // Direct mutation
    arr.push(4);
    expect(arr.length).toBe(4);

    // Use produce for immutable update
    const arr2 = produce(arr, draft => {
      draft.push(5);
    });

    // Original unchanged by produce
    expect(arr.length).toBe(4);
    expect(arr2.length).toBe(5);

    // But arr2 can also be mutated directly
    arr2.push(6);
    expect(arr2.length).toBe(6);
  });
});

describe('Large arrays', () => {
  it('handles large arrays efficiently', () => {
    const large = Array.from({ length: 10000 }, (_, i) => i);
    const arr = pura(large);

    expect(arr.length).toBe(10000);
    expect(arr[5000]).toBe(5000);
  });

  it('produce on large arrays', () => {
    const large = Array.from({ length: 10000 }, (_, i) => i);
    const arr = pura(large);

    const result = produce(arr, draft => {
      draft[5000] = 999;
      draft.push(10000);
    });

    expect(arr[5000]).toBe(5000);
    expect(arr.length).toBe(10000);

    expect(result[5000]).toBe(999);
    expect(result.length).toBe(10001);
  });
});

describe('Three APIs - pura(), produce(), unpura()', () => {
  describe('pura() accepts both native and efficient arrays', () => {
    it('native array -> efficient array', () => {
      const native = [1, 2, 3];
      const efficient = pura(native);

      expect(efficient[0]).toBe(1);
      expect(efficient.length).toBe(3);
    });

    it('efficient array -> returns same array', () => {
      const efficient1 = pura([1, 2, 3]);
      const efficient2 = pura(efficient1);

      expect(efficient1 === efficient2).toBe(true);
    });

    it('works the same regardless of input type', () => {
      const native = [1, 2, 3];
      const fromNative = pura(native);

      const efficient = pura([10, 20, 30]);
      const fromEfficient = pura(efficient);

      // Both work exactly the same
      fromNative.push(4);
      fromEfficient.push(40);

      expect(fromNative.length).toBe(4);
      expect(fromEfficient.length).toBe(4);
      expect(fromNative[3]).toBe(4);
      expect(fromEfficient[3]).toBe(40);
    });
  });

  describe('produce() accepts both native and efficient arrays', () => {
    it('native array -> efficient array', () => {
      const native = [1, 2, 3];
      const result = produce(native, draft => {
        draft.push(4);
      });

      expect(native).toEqual([1, 2, 3]);
      expect(result.length).toBe(4);
    });

    it('efficient array -> efficient array', () => {
      const efficient = pura([1, 2, 3]);
      const result = produce(efficient, draft => {
        draft.push(4);
      });

      expect(efficient.length).toBe(3);
      expect(result.length).toBe(4);
    });

    it('works the same regardless of input type', () => {
      const native = [1, 2, 3];
      const efficient = pura([1, 2, 3]);

      const r1 = produce(native, draft => draft.push(4));
      const r2 = produce(efficient, draft => draft.push(4));

      // Both produce the same result
      expect(r1.length).toBe(4);
      expect(r2.length).toBe(4);
      expect(r1[3]).toBe(4);
      expect(r2[3]).toBe(4);
    });
  });

  describe('unpura() accepts both native and efficient arrays', () => {
    it('efficient array -> native array', () => {
      const efficient = pura([1, 2, 3]);
      const native = unpura(efficient);

      expect(Array.isArray(native)).toBe(true);
      expect(native).toEqual([1, 2, 3]);
    });

    it('native array -> returns same array', () => {
      const native = [1, 2, 3];
      const result = unpura(native);

      expect(result === native).toBe(true);
    });

    it('works the same regardless of input type', () => {
      const native = [1, 2, 3];
      const efficient = pura([1, 2, 3]);

      const r1 = unpura(native);
      const r2 = unpura(efficient);

      // Both return native arrays
      expect(r1).toEqual([1, 2, 3]);
      expect(r2).toEqual([1, 2, 3]);
    });
  });

  describe('Complete workflow - seamless interop', () => {
    it('can mix native and efficient arrays freely', () => {
      // Start with native
      const native = [1, 2, 3];

      // Convert to efficient
      const efficient1 = pura(native);
      efficient1.push(4);

      // produce works with both
      const efficient2 = produce(native, draft => draft.push(5));
      const efficient3 = produce(efficient1, draft => draft.push(6));

      // unpura works with both
      const back1 = unpura(efficient2);
      const back2 = unpura(efficient3);

      expect(back1).toEqual([1, 2, 3, 5]);
      expect(back2).toEqual([1, 2, 3, 4, 6]);
    });

    it('pura on pura result is idempotent', () => {
      const arr1 = pura([1, 2, 3]);
      const arr2 = pura(arr1);
      const arr3 = pura(arr2);

      expect(arr1 === arr2).toBe(true);
      expect(arr2 === arr3).toBe(true);
    });

    it('unpura on native is idempotent', () => {
      const native = [1, 2, 3];
      const result1 = unpura(native);
      const result2 = unpura(result1);

      expect(native === result1).toBe(true);
      expect(result1 === result2).toBe(true);
    });
  });
});
