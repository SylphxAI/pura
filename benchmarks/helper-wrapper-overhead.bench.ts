/**
 * Micro-benchmark: Helper Wrapper Overhead
 *
 * 測試 ProduceFast 的 helper wrapper 引入的實際開銷
 */

import { bench, describe } from 'vitest';
import { pura, produce, produceFast } from '../packages/core/src/index';

// ============================================================
// 測試數據
// ============================================================

const MEDIUM = 1000;
const puraArr = pura(Array.from({ length: MEDIUM }, (_, i) => i));

// ============================================================
// Scenario 1: Single Operation
// ============================================================

describe('Single Operation - Helper Wrapper Overhead', () => {
  bench('Direct: produce(puraArr, d => d[500] = 999)', () => {
    return produce(puraArr, d => {
      d[500] = 999;
    });
  });

  bench('Wrapper: produceFast(puraArr, $ => $.set(500, 999))', () => {
    return produceFast(puraArr, $ => {
      $.set(500, 999);
    });
  });
});

// ============================================================
// Scenario 2: Multiple Operations (10)
// ============================================================

describe('Multiple Operations (10) - Helper Wrapper Overhead', () => {
  const indices = [100, 200, 300, 400, 500, 600, 700, 800, 900, 999];

  bench('Direct: produce with draft[i] = value', () => {
    return produce(puraArr, d => {
      for (const idx of indices) {
        d[idx] = 999;
      }
    });
  });

  bench('Wrapper: produceFast with $.set(i, value)', () => {
    return produceFast(puraArr, $ => {
      for (const idx of indices) {
        $.set(idx, 999);
      }
    });
  });
});

// ============================================================
// Scenario 3: Push Operation
// ============================================================

describe('Push Operation - Helper Wrapper Overhead', () => {
  bench('Direct: produce(puraArr, d => d.push(1000))', () => {
    return produce(puraArr, d => {
      d.push(1000);
    });
  });

  bench('Wrapper: produceFast(puraArr, $ => $.push(1000))', () => {
    return produceFast(puraArr, $ => {
      $.push(1000);
    });
  });
});

// ============================================================
// Scenario 4: 隔離測試 - 純函數調用開銷
// ============================================================

describe('Isolated: Function Call Overhead', () => {
  // 模擬 direct draft 操作
  function directOperation(arr: any[], index: number, value: any) {
    arr[index] = value;
  }

  // 模擬 helper wrapper 操作
  interface Helper {
    set(index: number, value: any): void;
  }

  function wrappedOperation(helper: Helper, index: number, value: any) {
    helper.set(index, value);
  }

  const testArr = new Array(MEDIUM).fill(0);

  bench('Direct: arr[500] = 999', () => {
    directOperation(testArr, 500, 999);
  });

  bench('Wrapped: helper.set(500, 999)', () => {
    const helper: Helper = {
      set(index: number, value: any) {
        testArr[index] = value;
      }
    };
    wrappedOperation(helper, 500, 999);
  });

  bench('Wrapped (pre-created): helper.set(500, 999)', () => {
    // 預先創建 helper，只測量調用開銷
    const helper: Helper = {
      set(index: number, value: any) {
        testArr[index] = value;
      }
    };
    helper.set(500, 999);
  });
});

// ============================================================
// Scenario 5: Object Creation Overhead
// ============================================================

describe('Isolated: Object Creation Overhead', () => {
  const testArr = new Array(MEDIUM).fill(0);

  bench('No object creation', () => {
    testArr[500] = 999;
  });

  bench('Create object + call method', () => {
    const helper = {
      set(index: number, value: any) {
        testArr[index] = value;
      }
    };
    helper.set(500, 999);
  });

  bench('Create object only (no method call)', () => {
    const helper = {
      set(index: number, value: any) {
        testArr[index] = value;
      }
    };
    // 不調用，只測量創建開銷
  });
});

// ============================================================
// Scenario 6: Inline vs Closure
// ============================================================

describe('Isolated: Inline vs Closure Overhead', () => {
  const testArr = new Array(MEDIUM).fill(0);

  bench('Inline operation', () => {
    testArr[500] = 999;
  });

  bench('Closure (capture testArr)', () => {
    const helper = {
      set(index: number, value: any) {
        testArr[index] = value;  // Closure captures testArr
      }
    };
    helper.set(500, 999);
  });

  bench('Closure (no capture, arr passed)', () => {
    const helper = {
      set(arr: any[], index: number, value: any) {
        arr[index] = value;
      }
    };
    helper.set(testArr, 500, 999);
  });
});

// ============================================================
// Scenario 7: Different Helper Implementations
// ============================================================

describe('Helper Implementation Variations', () => {
  const testArr = new Array(MEDIUM).fill(0);

  bench('Object literal helper', () => {
    const helper = {
      set(index: number, value: any) {
        testArr[index] = value;
      }
    };
    helper.set(500, 999);
  });

  bench('Class-based helper', () => {
    class Helper {
      set(index: number, value: any) {
        testArr[index] = value;
      }
    }
    const helper = new Helper();
    helper.set(500, 999);
  });

  bench('Arrow function helper', () => {
    const set = (index: number, value: any) => {
      testArr[index] = value;
    };
    set(500, 999);
  });

  bench('Direct function call', () => {
    function set(index: number, value: any) {
      testArr[index] = value;
    }
    set(500, 999);
  });
});
