/**
 * Small List Optimizations Benchmark
 *
 * Comparing specialized small list implementations vs regular persistent vector
 */

import { bench, describe } from 'vitest';
import { IList } from '../packages/core/src/list';
import {
  IListOf2,
  IListOf3,
  IListOf4,
  IListSmall,
  createSmallList,
} from '../packages/core/src/list-small';

describe('Small List vs Regular List: 2 elements', () => {
  const values = [1, 2];
  const regularList = IList.from(values);
  const smallList = new IListOf2(1, 2);
  const nativeArray = [1, 2];

  // READ
  bench('IListOf2 - get(0)', () => {
    smallList.get(0);
  });

  bench('IList (regular) - get(0)', () => {
    regularList.get(0);
  });

  bench('Array (native) - [0]', () => {
    nativeArray[0];
  });

  // WRITE
  bench('IListOf2 - set(0, 999)', () => {
    smallList.set(0, 999);
  });

  bench('IList (regular) - set(0, 999)', () => {
    regularList.set(0, 999);
  });

  bench('Array (naive FP) - set [0] = 999 (spread)', () => {
    const copy = [...nativeArray];
    copy[0] = 999;
  });
});

describe('Small List vs Regular List: 4 elements', () => {
  const values = [1, 2, 3, 4];
  const regularList = IList.from(values);
  const smallList = new IListOf4(1, 2, 3, 4);
  const nativeArray = [1, 2, 3, 4];

  // READ
  bench('IListOf4 - get(2)', () => {
    smallList.get(2);
  });

  bench('IList (regular) - get(2)', () => {
    regularList.get(2);
  });

  bench('Array (native) - [2]', () => {
    nativeArray[2];
  });

  // WRITE
  bench('IListOf4 - set(2, 999)', () => {
    smallList.set(2, 999);
  });

  bench('IList (regular) - set(2, 999)', () => {
    regularList.set(2, 999);
  });

  bench('Array (naive FP) - set [2] = 999 (spread)', () => {
    const copy = [...nativeArray];
    copy[2] = 999;
  });
});

describe('Small List vs Regular List: 20 elements', () => {
  const values = Array.from({ length: 20 }, (_, i) => i);
  const regularList = IList.from(values);
  const smallList = new IListSmall(Object.freeze([...values]));
  const nativeArray = [...values];

  // READ
  bench('IListSmall - get(10)', () => {
    smallList.get(10);
  });

  bench('IList (regular) - get(10)', () => {
    regularList.get(10);
  });

  bench('Array (native) - [10]', () => {
    nativeArray[10];
  });

  // WRITE
  bench('IListSmall - set(10, 999)', () => {
    smallList.set(10, 999);
  });

  bench('IList (regular) - set(10, 999)', () => {
    regularList.set(10, 999);
  });

  bench('Array (naive FP) - set [10] = 999 (spread)', () => {
    const copy = [...nativeArray];
    copy[10] = 999;
  });

  // PUSH
  bench('IListSmall - push(999)', () => {
    smallList.push(999);
  });

  bench('IList (regular) - push(999)', () => {
    regularList.push(999);
  });

  bench('Array (naive FP) - push(999) (spread)', () => {
    [...nativeArray, 999];
  });
});

describe('Small List vs Regular List: Build from scratch', () => {
  // Build 10-element list
  bench('IListSmall - build 10 elements', () => {
    const items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    createSmallList(items);
  });

  bench('IList (regular) - build 10 elements', () => {
    IList.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  bench('Array (native) - build 10 elements', () => {
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  });

  // Build 30-element list
  bench('IListSmall - build 30 elements', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    createSmallList(items);
  });

  bench('IList (regular) - build 30 elements', () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    IList.from(items);
  });

  bench('Array (native) - build 30 elements', () => {
    Array.from({ length: 30 }, (_, i) => i);
  });
});

describe('Small List: Sequential Updates', () => {
  const size = 20;
  const values = Array.from({ length: size }, (_, i) => i);

  bench('IListSmall - 10 sequential sets', () => {
    let list = new IListSmall(Object.freeze([...values]));
    for (let i = 0; i < 10; i++) {
      list = list.set(i, 999);
    }
  });

  bench('IList (regular) - 10 sequential sets', () => {
    let list = IList.from(values);
    for (let i = 0; i < 10; i++) {
      list = list.set(i, 999);
    }
  });

  bench('Array (naive FP) - 10 sequential sets (10 spreads)', () => {
    let arr = [...values];
    for (let i = 0; i < 10; i++) {
      const copy = [...arr];
      copy[i] = 999;
      arr = copy;
    }
  });

  bench('Array (mutation) - 10 sequential sets', () => {
    const arr = [...values];
    for (let i = 0; i < 10; i++) {
      arr[i] = 999;
    }
  });
});
