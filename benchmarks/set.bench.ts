/**
 * Benchmark: Pura Set vs Native Set
 *
 * Compares three approaches:
 * 1. Native Set (direct mutation)
 * 2. Native Set with copy (immutable via new Set())
 * 3. Pura Set (structural sharing)
 */

import { bench, describe } from 'vitest';
import { pura, produce } from '../packages/core/src/index';

// ===== Setup =====
const SMALL = 10;
const MEDIUM = 100;
const LARGE = 1000;

function createSet(size: number): Set<number> {
  return new Set(Array.from({ length: size }, (_, i) => i));
}

function createStringSet(size: number): Set<string> {
  return new Set(Array.from({ length: size }, (_, i) => `item${i}`));
}

// ===== Small sets (10 values) =====
describe('Small set (10 values) - Add', () => {
  const nativeSmall = createSet(SMALL);
  const puraSmall = pura(createSet(SMALL));

  bench('Native (direct add)', () => {
    nativeSmall.add(999);
    nativeSmall.delete(999);
    return nativeSmall;
  });

  bench('Native (copy then add)', () => {
    const copy = new Set(nativeSmall);
    copy.add(999);
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraSmall, draft => {
      draft.add(999);
    });
  });
});

describe('Small set (10 values) - Delete', () => {
  const nativeSmall = createSet(SMALL);
  const puraSmall = pura(createSet(SMALL));

  bench('Native (direct delete)', () => {
    nativeSmall.delete(5);
    nativeSmall.add(5);
    return nativeSmall;
  });

  bench('Native (copy then delete)', () => {
    const copy = new Set(nativeSmall);
    copy.delete(5);
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraSmall, draft => {
      draft.delete(5);
    });
  });
});

// ===== Medium sets (100 values) =====
describe('Medium set (100 values) - Add single', () => {
  const nativeMedium = createSet(MEDIUM);
  const puraMedium = pura(createSet(MEDIUM));

  bench('Native (direct add)', () => {
    nativeMedium.add(999);
    nativeMedium.delete(999);
    return nativeMedium;
  });

  bench('Native (copy then add)', () => {
    const copy = new Set(nativeMedium);
    copy.add(999);
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraMedium, draft => {
      draft.add(999);
    });
  });
});

describe('Medium set (100 values) - Add multiple (10 values)', () => {
  const nativeMedium = createSet(MEDIUM);
  const puraMedium = pura(createSet(MEDIUM));
  const toAdd = [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009];

  bench('Native (direct add)', () => {
    for (const v of toAdd) {
      nativeMedium.add(v);
    }
    for (const v of toAdd) {
      nativeMedium.delete(v);
    }
    return nativeMedium;
  });

  bench('Native (copy then add)', () => {
    const copy = new Set(nativeMedium);
    for (const v of toAdd) {
      copy.add(v);
    }
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraMedium, draft => {
      for (const v of toAdd) {
        draft.add(v);
      }
    });
  });
});

// ===== Large sets (1000 values) =====
describe('Large set (1000 values) - Add single', () => {
  const nativeLarge = createSet(LARGE);
  const puraLarge = pura(createSet(LARGE));

  bench('Native (direct add)', () => {
    nativeLarge.add(9999);
    nativeLarge.delete(9999);
    return nativeLarge;
  });

  bench('Native (copy then add)', () => {
    const copy = new Set(nativeLarge);
    copy.add(9999);
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraLarge, draft => {
      draft.add(9999);
    });
  });
});

describe('Large set (1000 values) - Delete single', () => {
  const nativeLarge = createSet(LARGE);
  const puraLarge = pura(createSet(LARGE));

  bench('Native (direct delete)', () => {
    nativeLarge.delete(500);
    nativeLarge.add(500);
    return nativeLarge;
  });

  bench('Native (copy then delete)', () => {
    const copy = new Set(nativeLarge);
    copy.delete(500);
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraLarge, draft => {
      draft.delete(500);
    });
  });
});

describe('Large set (1000 values) - Delete multiple (100 values)', () => {
  const nativeLarge = createSet(LARGE);
  const puraLarge = pura(createSet(LARGE));
  const toDelete = Array.from({ length: 100 }, (_, i) => i * 10);

  bench('Native (direct delete)', () => {
    for (const v of toDelete) {
      nativeLarge.delete(v);
    }
    for (const v of toDelete) {
      nativeLarge.add(v);
    }
    return nativeLarge;
  });

  bench('Native (copy then delete)', () => {
    const copy = new Set(nativeLarge);
    for (const v of toDelete) {
      copy.delete(v);
    }
    return copy;
  });

  bench('Pura (produce)', () => {
    return produce(puraLarge, draft => {
      for (const v of toDelete) {
        draft.delete(v);
      }
    });
  });
});

// ===== Read operations =====
describe('Large set (1000 values) - Has check', () => {
  const nativeLarge = createSet(LARGE);
  const puraLarge = pura(createSet(LARGE));

  bench('Native (has)', () => {
    return nativeLarge.has(500);
  });

  bench('Pura (has)', () => {
    return puraLarge.has(500);
  });
});

describe('Large set (1000 values) - Size', () => {
  const nativeLarge = createSet(LARGE);
  const puraLarge = pura(createSet(LARGE));

  bench('Native (size)', () => {
    return nativeLarge.size;
  });

  bench('Pura (size)', () => {
    return puraLarge.size;
  });
});

describe('Large set (1000 values) - Iterate all', () => {
  const nativeLarge = createSet(LARGE);
  const puraLarge = pura(createSet(LARGE));

  bench('Native (forEach)', () => {
    let sum = 0;
    nativeLarge.forEach(v => { sum += v; });
    return sum;
  });

  bench('Pura (forEach)', () => {
    let sum = 0;
    puraLarge.forEach(v => { sum += v; });
    return sum;
  });

  bench('Native (for...of)', () => {
    let sum = 0;
    for (const v of nativeLarge) {
      sum += v;
    }
    return sum;
  });

  bench('Pura (for...of)', () => {
    let sum = 0;
    for (const v of puraLarge) {
      sum += v;
    }
    return sum;
  });

  bench('Native (spread)', () => {
    return [...nativeLarge].reduce((a, b) => a + b, 0);
  });

  bench('Pura (spread)', () => {
    return [...puraLarge].reduce((a, b) => a + b, 0);
  });
});

// ===== Set operations =====
describe('Medium set (100 values) - Union', () => {
  const set1 = createSet(MEDIUM);
  const set2 = new Set(Array.from({ length: 50 }, (_, i) => i + 75)); // 75-124, overlaps 75-99
  const puraSet1 = pura(createSet(MEDIUM));

  bench('Native (direct union)', () => {
    const union = new Set(set1);
    for (const v of set2) {
      union.add(v);
    }
    return union;
  });

  bench('Pura (produce union)', () => {
    return produce(puraSet1, draft => {
      for (const v of set2) {
        draft.add(v);
      }
    });
  });
});

describe('Medium set (100 values) - Intersection', () => {
  const set1 = createSet(MEDIUM);
  const set2 = new Set(Array.from({ length: 50 }, (_, i) => i * 2)); // Even numbers 0-98
  const puraSet1 = pura(createSet(MEDIUM));

  bench('Native (intersection)', () => {
    const result = new Set<number>();
    for (const v of set1) {
      if (set2.has(v)) result.add(v);
    }
    return result;
  });

  bench('Pura (produce intersection)', () => {
    return produce(puraSet1, draft => {
      for (const v of draft) {
        if (!set2.has(v)) draft.delete(v);
      }
    });
  });
});

describe('Medium set (100 values) - Difference', () => {
  const set1 = createSet(MEDIUM);
  const set2 = new Set(Array.from({ length: 50 }, (_, i) => i)); // 0-49
  const puraSet1 = pura(createSet(MEDIUM));

  bench('Native (difference)', () => {
    const result = new Set(set1);
    for (const v of set2) {
      result.delete(v);
    }
    return result;
  });

  bench('Pura (produce difference)', () => {
    return produce(puraSet1, draft => {
      for (const v of set2) {
        draft.delete(v);
      }
    });
  });
});

// ===== Clear operation =====
describe('Large set (1000 values) - Clear', () => {
  bench('Native (direct clear)', () => {
    const set = createSet(LARGE);
    set.clear();
    return set;
  });

  bench('Native (new empty)', () => {
    return new Set<number>();
  });

  bench('Pura (produce clear)', () => {
    const set = pura(createSet(LARGE));
    return produce(set, draft => {
      draft.clear();
    });
  });
});

// ===== Creation =====
describe('Set creation (1000 values)', () => {
  const values = Array.from({ length: LARGE }, (_, i) => i);

  bench('Native (from array)', () => {
    return new Set(values);
  });

  bench('Native (from existing)', () => {
    const source = new Set(values);
    return new Set(source);
  });

  bench('Pura (from Set)', () => {
    return pura(new Set(values));
  });
});

// ===== Nested sets =====
describe('Set inside object - Update', () => {
  const nativeObj = { tags: new Set(['a', 'b', 'c']) };
  const puraObj = pura({ tags: new Set(['a', 'b', 'c']) });

  bench('Native (direct add)', () => {
    nativeObj.tags.add('d');
    nativeObj.tags.delete('d');
    return nativeObj;
  });

  bench('Native (copy)', () => {
    return {
      ...nativeObj,
      tags: new Set([...nativeObj.tags, 'd'])
    };
  });

  bench('Pura (produce)', () => {
    return produce(puraObj, draft => {
      draft.tags.add('d');
    });
  });
});

// ===== String sets =====
describe('Large string set (1000 values) - Operations', () => {
  const nativeStringSet = createStringSet(LARGE);
  const puraStringSet = pura(createStringSet(LARGE));

  bench('Native (has string)', () => {
    return nativeStringSet.has('item500');
  });

  bench('Pura (has string)', () => {
    return puraStringSet.has('item500');
  });

  bench('Native (add string)', () => {
    nativeStringSet.add('newItem');
    nativeStringSet.delete('newItem');
    return nativeStringSet;
  });

  bench('Pura (produce add string)', () => {
    return produce(puraStringSet, draft => {
      draft.add('newItem');
    });
  });
});
