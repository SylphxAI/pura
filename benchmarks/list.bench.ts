import { bench, describe } from 'vitest';
import { IList } from '../packages/core/src/list';

describe('IList vs native Array - Small (10 elements)', () => {
  const values = Array.from({ length: 10 }, (_, i) => i);

  bench('IList - create from values', () => {
    IList.from(values);
  });

  bench('native Array - create from values', () => {
    [...values];
  });

  const ilist = IList.from(values);
  const array = [...values];

  bench('IList - get', () => {
    ilist.get(5);
  });

  bench('native Array - get', () => {
    array[5];
  });

  bench('IList - set (immutable)', () => {
    ilist.set(5, 999);
  });

  bench('native Array - set (copy)', () => {
    const copy = [...array];
    copy[5] = 999;
  });

  bench('IList - push (immutable)', () => {
    ilist.push(999);
  });

  bench('native Array - push (copy)', () => {
    [...array, 999];
  });

  bench('IList - pop (immutable)', () => {
    ilist.pop();
  });

  bench('native Array - pop (copy)', () => {
    array.slice(0, -1);
  });
});

describe('IList vs native Array - Medium (100 elements)', () => {
  const values = Array.from({ length: 100 }, (_, i) => i);

  bench('IList - create from 100 values', () => {
    IList.from(values);
  });

  bench('native Array - create from 100 values', () => {
    [...values];
  });

  const ilist = IList.from(values);
  const array = [...values];

  bench('IList - get (100 elements)', () => {
    ilist.get(50);
  });

  bench('native Array - get (100 elements)', () => {
    array[50];
  });

  bench('IList - set (100 elements)', () => {
    ilist.set(50, 999);
  });

  bench('native Array - set (100 elements, copy)', () => {
    const copy = [...array];
    copy[50] = 999;
  });

  bench('IList - push (100 elements)', () => {
    ilist.push(999);
  });

  bench('native Array - push (100 elements, copy)', () => {
    [...array, 999];
  });
});

describe('IList vs native Array - Large (1000 elements)', () => {
  const values = Array.from({ length: 1000 }, (_, i) => i);

  bench('IList - create from 1000 values', () => {
    IList.from(values);
  });

  bench('native Array - create from 1000 values', () => {
    [...values];
  });

  const ilist = IList.from(values);
  const array = [...values];

  bench('IList - get (1000 elements)', () => {
    ilist.get(500);
  });

  bench('native Array - get (1000 elements)', () => {
    array[500];
  });

  bench('IList - set (1000 elements)', () => {
    ilist.set(500, 999);
  });

  bench('native Array - set (1000 elements, copy)', () => {
    const copy = [...array];
    copy[500] = 999;
  });

  bench('IList - 10 sequential pushes', () => {
    let list = ilist;
    for (let i = 0; i < 10; i++) {
      list = list.push(i);
    }
  });

  bench('native Array - 10 sequential pushes (naive copy)', () => {
    let arr = array;
    for (let i = 0; i < 10; i++) {
      arr = [...arr, i];
    }
  });

  bench('native Array - 10 sequential pushes (mutable)', () => {
    const arr = [...array];
    for (let i = 0; i < 10; i++) {
      arr.push(i);
    }
  });
});

describe('IList - Structural sharing benefits', () => {
  const ilist = IList.from(Array.from({ length: 1000 }, (_, i) => i));

  bench('IList - push (amortized O(1))', () => {
    ilist.push(999);
  });

  bench('IList - pop (amortized O(1))', () => {
    ilist.pop();
  });

  bench('IList - get from tail (O(1))', () => {
    ilist.get(990);
  });

  bench('IList - get from tree (O(log n))', () => {
    ilist.get(500);
  });
});

describe('IList - Iteration performance', () => {
  const values = Array.from({ length: 1000 }, (_, i) => i);
  const ilist = IList.from(values);
  const array = [...values];

  bench('IList - iterate all elements', () => {
    for (const value of ilist) {
      // Access to prevent optimization
      value && value;
    }
  });

  bench('native Array - iterate all elements', () => {
    for (const value of array) {
      value && value;
    }
  });

  bench('IList - map', () => {
    ilist.map((x) => x * 2);
  });

  bench('native Array - map (immutable)', () => {
    array.map((x) => x * 2);
  });

  bench('IList - filter', () => {
    ilist.filter((x) => x % 2 === 0);
  });

  bench('native Array - filter (immutable)', () => {
    array.filter((x) => x % 2 === 0);
  });
});

describe('IList vs native Array - Concat performance', () => {
  const list1 = IList.from(Array.from({ length: 100 }, (_, i) => i));
  const list2 = IList.from(Array.from({ length: 100 }, (_, i) => i + 100));
  const array1 = Array.from({ length: 100 }, (_, i) => i);
  const array2 = Array.from({ length: 100 }, (_, i) => i + 100);

  bench('IList - concat (100 + 100)', () => {
    list1.concat(list2);
  });

  bench('native Array - concat (100 + 100)', () => {
    [...array1, ...array2];
  });

  const largeList1 = IList.from(Array.from({ length: 1000 }, (_, i) => i));
  const largeList2 = IList.from(Array.from({ length: 1000 }, (_, i) => i + 1000));
  const largeArray1 = Array.from({ length: 1000 }, (_, i) => i);
  const largeArray2 = Array.from({ length: 1000 }, (_, i) => i + 1000);

  bench('IList - concat (1000 + 1000)', () => {
    largeList1.concat(largeList2);
  });

  bench('native Array - concat (1000 + 1000)', () => {
    [...largeArray1, ...largeArray2];
  });
});
