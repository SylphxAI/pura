/**
 * ProduceFast Performance Benchmarks
 *
 * Compare:
 * 1. Native (direct copy/spread)
 * 2. ProduceFast
 * 3. Produce (proxy tracking)
 *
 * Target: ProduceFast ~1.1-1.5x slower than Native
 */

import { bench, describe } from 'vitest';
import { produce, produceFast } from '../packages/core/src/index';

// ===== Test Data =====

type User = {
  name: string;
  age: number;
  profile: {
    bio: string;
    avatar: string;
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
};

const createUser = (): User => ({
  name: 'Bob',
  age: 25,
  profile: {
    bio: 'Hello',
    avatar: 'url',
    settings: {
      theme: 'light',
      notifications: true
    }
  }
});

// ===== Array Benchmarks =====

describe('Array - Single update', () => {
  const arr = [1, 2, 3, 4, 5];

  bench('Native (spread)', () => {
    const result = [...arr];
    result[2] = 100;
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(arr, $ => {
      $.set(2, 100);
    });
  });

  bench('Produce', () => {
    return produce(arr, draft => {
      draft[2] = 100;
    });
  });
});

describe('Array - Multiple updates', () => {
  const arr = [1, 2, 3, 4, 5];

  bench('Native (spread)', () => {
    const result = [...arr];
    result[0] = 100;
    result[2] = 200;
    result[4] = 300;
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(arr, $ => {
      $.set(0, 100);
      $.set(2, 200);
      $.set(4, 300);
    });
  });

  bench('Produce', () => {
    return produce(arr, draft => {
      draft[0] = 100;
      draft[2] = 200;
      draft[4] = 300;
    });
  });
});

describe('Array - Push operations', () => {
  const arr = [1, 2, 3];

  bench('Native (spread + push)', () => {
    const result = [...arr];
    result.push(4, 5, 6);
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(arr, $ => {
      $.push(4, 5, 6);
    });
  });

  bench('Produce', () => {
    return produce(arr, draft => {
      draft.push(4, 5, 6);
    });
  });
});

describe('Array - Splice operations', () => {
  const arr = [1, 2, 3, 4, 5];

  bench('Native (spread + splice)', () => {
    const result = [...arr];
    result.splice(1, 2, 10, 20);
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(arr, $ => {
      $.splice(1, 2, 10, 20);
    });
  });

  bench('Produce', () => {
    return produce(arr, draft => {
      draft.splice(1, 2, 10, 20);
    });
  });
});

// ===== Map Benchmarks =====

describe('Map - Single set', () => {
  const map = new Map([['a', 1], ['b', 2], ['c', 3]]);

  bench('Native (new Map + set)', () => {
    const result = new Map(map);
    result.set('b', 100);
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(map, $ => {
      $.set('b', 100);
    });
  });

  bench('Produce', () => {
    return produce(map, draft => {
      draft.set('b', 100);
    });
  });
});

describe('Map - Multiple sets', () => {
  const map = new Map([['a', 1], ['b', 2]]);

  bench('Native (new Map + multiple sets)', () => {
    const result = new Map(map);
    result.set('c', 3);
    result.set('d', 4);
    result.set('e', 5);
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(map, $ => {
      $.set('c', 3);
      $.set('d', 4);
      $.set('e', 5);
    });
  });

  bench('Produce', () => {
    return produce(map, draft => {
      draft.set('c', 3);
      draft.set('d', 4);
      draft.set('e', 5);
    });
  });
});

// ===== Set Benchmarks =====

describe('Set - Single add', () => {
  const set = new Set([1, 2, 3]);

  bench('Native (new Set + add)', () => {
    const result = new Set(set);
    result.add(4);
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(set, $ => {
      $.add(4);
    });
  });

  bench('Produce', () => {
    return produce(set, draft => {
      draft.add(4);
    });
  });
});

describe('Set - Multiple adds', () => {
  const set = new Set([1, 2, 3]);

  bench('Native (new Set + multiple adds)', () => {
    const result = new Set(set);
    result.add(4);
    result.add(5);
    result.add(6);
    return result;
  });

  bench('ProduceFast', () => {
    return produceFast(set, $ => {
      $.add(4);
      $.add(5);
      $.add(6);
    });
  });

  bench('Produce', () => {
    return produce(set, draft => {
      draft.add(4);
      draft.add(5);
      draft.add(6);
    });
  });
});

// ===== Object Benchmarks =====

describe('Object - Single shallow update', () => {
  const user = createUser();

  bench('Native (spread)', () => {
    return {
      ...user,
      name: 'Alice'
    };
  });

  bench('ProduceFast', () => {
    return produceFast(user, $ => {
      $.set(['name'], 'Alice');
    });
  });

  bench('Produce', () => {
    return produce(user, draft => {
      draft.name = 'Alice';
    });
  });
});

describe('Object - Multiple shallow updates', () => {
  const user = createUser();

  bench('Native (spread)', () => {
    return {
      ...user,
      name: 'Alice',
      age: 30
    };
  });

  bench('ProduceFast', () => {
    return produceFast(user, $ => {
      $.set(['name'], 'Alice');
      $.set(['age'], 30);
    });
  });

  bench('Produce', () => {
    return produce(user, draft => {
      draft.name = 'Alice';
      draft.age = 30;
    });
  });
});

describe('Object - Single deep update', () => {
  const user = createUser();

  bench('Native (nested spread)', () => {
    return {
      ...user,
      profile: {
        ...user.profile,
        bio: 'New bio'
      }
    };
  });

  bench('ProduceFast', () => {
    return produceFast(user, $ => {
      $.set(['profile', 'bio'], 'New bio');
    });
  });

  bench('Produce', () => {
    return produce(user, draft => {
      draft.profile.bio = 'New bio';
    });
  });
});

describe('Object - Multiple deep updates', () => {
  const user = createUser();

  bench('Native (nested spread)', () => {
    return {
      ...user,
      name: 'Alice',
      age: 30,
      profile: {
        ...user.profile,
        bio: 'New bio',
        settings: {
          ...user.profile.settings,
          theme: 'dark'
        }
      }
    };
  });

  bench('ProduceFast', () => {
    return produceFast(user, $ => {
      $.set(['name'], 'Alice');
      $.set(['age'], 30);
      $.set(['profile', 'bio'], 'New bio');
      $.set(['profile', 'settings', 'theme'], 'dark');
    });
  });

  bench('Produce', () => {
    return produce(user, draft => {
      draft.name = 'Alice';
      draft.age = 30;
      draft.profile.bio = 'New bio';
      draft.profile.settings.theme = 'dark';
    });
  });
});

describe('Object - Update with function', () => {
  const user = createUser();

  bench('Native (spread)', () => {
    return {
      ...user,
      age: user.age + 1
    };
  });

  bench('ProduceFast', () => {
    return produceFast(user, $ => {
      $.update(['age'], age => age + 1);
    });
  });

  bench('Produce', () => {
    return produce(user, draft => {
      draft.age += 1;
    });
  });
});

describe('Object - Merge operation', () => {
  const user = createUser();

  bench('Native (spread)', () => {
    return {
      ...user,
      profile: {
        ...user.profile,
        bio: 'Updated',
        avatar: 'new-url'
      }
    };
  });

  bench('ProduceFast', () => {
    return produceFast(user, $ => {
      $.merge(['profile'], {
        bio: 'Updated',
        avatar: 'new-url'
      });
    });
  });

  bench('Produce', () => {
    return produce(user, draft => {
      draft.profile.bio = 'Updated';
      draft.profile.avatar = 'new-url';
    });
  });
});
