/**
 * Benchmark: Functional Programming Perspective
 *
 * Compares immutable operations:
 * 1. Native (mutable) - Direct mutation
 * 2. Native (copy) - Immutable via copy (FP style)
 * 3. Pura - Structural sharing (efficient immutable)
 */

import { bench, describe } from 'vitest';
import { pura, produce } from '../packages/core/src/index';

// ===== Setup =====
const SIZES = {
  small: 100,
  medium: 1000,
  large: 10000,
};

// ===== Helper: Create test data =====
function createData(size: number) {
  return Array.from({ length: size }, (_, i) => i);
}

// ===== Creation =====
describe('Creation (1000 items)', () => {
  const data = createData(SIZES.medium);

  bench('Native', () => {
    return [...data];
  });

  bench('Pura', () => {
    return pura(data);
  });
});

// ===== Push (append one item) =====
describe('Push 1 item - Small (100 items)', () => {
  const base = createData(SIZES.small);
  const puraBase = pura(base);

  bench('Mutable (direct)', () => {
    base.push(100);
    base.pop();
    return base;
  });

  bench('Native (spread)', () => {
    return [...base, 100];
  });

  bench('Pura (produce)', () => {
    return produce(puraBase, d => d.push(100));
  });
});

describe('Push 1 item - Large (10000 items)', () => {
  const base = createData(SIZES.large);
  const puraBase = pura(base);

  bench('Mutable (direct)', () => {
    base.push(10000);
    base.pop();
    return base;
  });

  bench('Native (spread)', () => {
    return [...base, 10000];
  });

  bench('Pura (produce)', () => {
    return produce(puraBase, d => d.push(10000));
  });
});

// ===== Push multiple items =====
describe('Push 10 items - Large (10000 items)', () => {
  const base = createData(SIZES.large);
  const puraBase = pura(base);
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  bench('Mutable (direct)', () => {
    base.push(...items);
    base.length -= 10;
    return base;
  });

  bench('Native (spread)', () => {
    return [...base, ...items];
  });

  bench('Pura (produce)', () => {
    return produce(puraBase, d => d.push(...items));
  });
});

// ===== Remove (pop) =====
describe('Pop - Large (10000 items)', () => {
  const base = createData(SIZES.large);
  const puraBase = pura(base);

  bench('Mutable (direct)', () => {
    const val = base.pop();
    base.push(val!);
    return base;
  });

  bench('Native (slice)', () => {
    return base.slice(0, -1);
  });

  bench('Pura (produce)', () => {
    return produce(puraBase, d => d.pop());
  });
});

// ===== Update single item =====
describe('Update single item - Small (100 items)', () => {
  const nativeSmall = createData(SIZES.small);
  const puraSmall = pura(nativeSmall);

  bench('Mutable (direct)', () => {
    const old = nativeSmall[50];
    nativeSmall[50] = 999;
    nativeSmall[50] = old!;  // Reset
    return nativeSmall;
  });

  bench('Native (spread + mutate)', () => {
    const arr = [...nativeSmall];
    arr[50] = 999;
    return arr;
  });

  bench('Native (map - FP)', () => {
    return nativeSmall.map((item, i) => i === 50 ? 999 : item);
  });

  bench('Pura (produce)', () => {
    return produce(puraSmall, draft => {
      draft[50] = 999;
    });
  });
});

describe('Update single item - Large (10000 items)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Mutable (direct)', () => {
    const old = nativeLarge[5000];
    nativeLarge[5000] = 999;
    nativeLarge[5000] = old!;  // Reset
    return nativeLarge;
  });

  bench('Native (spread + mutate)', () => {
    const arr = [...nativeLarge];
    arr[5000] = 999;
    return arr;
  });

  bench('Native (map - FP)', () => {
    return nativeLarge.map((item, i) => i === 5000 ? 999 : item);
  });

  bench('Native (slice - FP)', () => {
    return [...nativeLarge.slice(0, 5000), 999, ...nativeLarge.slice(5001)];
  });

  bench('Pura (produce)', () => {
    return produce(puraLarge, draft => {
      draft[5000] = 999;
    });
  });
});

// ===== Update multiple items =====
describe('Update 10 items - Large (10000 items)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);
  const indices = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

  bench('Mutable (direct)', () => {
    const oldVals = indices.map(i => nativeLarge[i]);
    for (const idx of indices) {
      nativeLarge[idx] = 999;
    }
    // Reset
    indices.forEach((idx, i) => { nativeLarge[idx] = oldVals[i]!; });
    return nativeLarge;
  });

  bench('Native (spread + mutate)', () => {
    const arr = [...nativeLarge];
    for (const idx of indices) {
      arr[idx] = 999;
    }
    return arr;
  });

  bench('Native (map - FP)', () => {
    return nativeLarge.map((item, i) => indices.includes(i) ? 999 : item);
  });

  bench('Pura (produce)', () => {
    return produce(puraLarge, draft => {
      for (const idx of indices) {
        draft[idx] = 999;
      }
    });
  });
});

// ===== Concat =====
describe('Concat two arrays - Medium (1000 + 1000 items)', () => {
  const native1 = createData(SIZES.medium);
  const native2 = createData(SIZES.medium);
  const pura1 = pura(native1);
  const pura2 = pura(native2);

  bench('Native (mutable)', () => {
    const arr = [...native1];
    arr.push(...native2);
    return arr;
  });

  bench('Native (copy - FP)', () => {
    return [...native1, ...native2];
  });

  bench('Pura (produce)', () => {
    return produce(pura1, draft => {
      for (const item of pura2) {
        draft.push(item);
      }
    });
  });
});

// ===== Slice =====
describe('Slice - Large (10000 items, take middle 100)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Native', () => {
    return nativeLarge.slice(4950, 5050);
  });

  bench('Pura', () => {
    return puraLarge.slice(4950, 5050);
  });
});

// ===== Filter =====
describe('Filter - Large (10000 items, keep ~50%)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Native', () => {
    return nativeLarge.filter(x => x % 2 === 0);
  });

  bench('Pura', () => {
    return puraLarge.filter(x => x % 2 === 0);
  });
});

// ===== Map =====
describe('Map - Large (10000 items)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Native', () => {
    return nativeLarge.map(x => x * 2);
  });

  bench('Pura', () => {
    return puraLarge.map(x => x * 2);
  });
});

// ===== Reduce =====
describe('Reduce - Large (10000 items)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Native', () => {
    return nativeLarge.reduce((acc, x) => acc + x, 0);
  });

  bench('Pura', () => {
    return puraLarge.reduce((acc, x) => acc + x, 0);
  });
});

// ===== Read single item =====
describe('Read single item - Large (10000 items)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Native', () => {
    return nativeLarge[5000];
  });

  bench('Pura', () => {
    return puraLarge[5000];
  });
});

// ===== Read all items (iteration) =====
describe('Read all items - Large (10000 items)', () => {
  const nativeLarge = createData(SIZES.large);
  const puraLarge = pura(nativeLarge);

  bench('Native (for loop)', () => {
    let sum = 0;
    for (let i = 0; i < nativeLarge.length; i++) {
      sum += nativeLarge[i]!;
    }
    return sum;
  });

  bench('Pura (for loop)', () => {
    let sum = 0;
    for (let i = 0; i < puraLarge.length; i++) {
      sum += puraLarge[i]!;
    }
    return sum;
  });

  bench('Native (for-of)', () => {
    let sum = 0;
    for (const item of nativeLarge) {
      sum += item;
    }
    return sum;
  });

  bench('Pura (for-of)', () => {
    let sum = 0;
    for (const item of puraLarge) {
      sum += item;
    }
    return sum;
  });
});

// ===== Complex FP operation: Multiple transformations =====
describe('Complex FP - Multiple operations (1000 items)', () => {
  const nativeMedium = createData(SIZES.medium);
  const puraMedium = pura(nativeMedium);

  bench('Native (copy - FP)', () => {
    let result = [...nativeMedium];
    result = result.map(x => x * 2);
    result = result.filter(x => x % 4 === 0);
    result = [...result, 9999];
    return result;
  });

  bench('Pura (multiple produce)', () => {
    let result = puraMedium;
    result = produce(result, d => {
      for (let i = 0; i < d.length; i++) {
        d[i] = d[i]! * 2;
      }
    });
    result = produce(result, d => {
      // Filter via mutation
      let writeIdx = 0;
      for (let i = 0; i < d.length; i++) {
        if (d[i]! % 4 === 0) {
          d[writeIdx] = d[i]!;
          writeIdx++;
        }
      }
      // Remove extra items
      while (d.length > writeIdx) {
        d.pop();
      }
    });
    result = produce(result, d => {
      d.push(9999);
    });
    return result;
  });

  bench('Pura (single produce)', () => {
    return produce(puraMedium, draft => {
      // Map
      for (let i = 0; i < draft.length; i++) {
        draft[i] = draft[i]! * 2;
      }
      // Filter
      let writeIdx = 0;
      for (let i = 0; i < draft.length; i++) {
        if (draft[i]! % 4 === 0) {
          draft[writeIdx] = draft[i]!;
          writeIdx++;
        }
      }
      while (draft.length > writeIdx) {
        draft.pop();
      }
      // Push
      draft.push(9999);
    });
  });
});

// ===== Sequential updates (common in state management) =====
describe('Sequential updates - Simulating state updates (1000 items)', () => {
  const nativeMedium = createData(SIZES.medium);
  const puraMedium = pura(nativeMedium);

  bench('Native (copy - FP)', () => {
    let state = nativeMedium;
    // Update 1
    state = [...state.slice(0, 100), 999, ...state.slice(101)];
    // Update 2
    state = [...state, 1000];
    // Update 3
    state = state.filter(x => x !== 500);
    // Update 4
    state = [...state.slice(0, 200), 888, ...state.slice(201)];
    // Update 5
    state = [...state, 2000, 3000];
    return state;
  });

  bench('Pura (separate produce calls)', () => {
    let state = puraMedium;
    // Update 1
    state = produce(state, d => { d[100] = 999; });
    // Update 2
    state = produce(state, d => { d.push(1000); });
    // Update 3
    state = produce(state, d => {
      let writeIdx = 0;
      for (let i = 0; i < d.length; i++) {
        if (d[i] !== 500) {
          d[writeIdx] = d[i]!;
          writeIdx++;
        }
      }
      while (d.length > writeIdx) {
        d.pop();
      }
    });
    // Update 4
    state = produce(state, d => { d[200] = 888; });
    // Update 5
    state = produce(state, d => { d.push(2000, 3000); });
    return state;
  });
});
