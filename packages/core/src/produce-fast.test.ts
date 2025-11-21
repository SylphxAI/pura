/**
 * ProduceFast Tests
 *
 * Tests type inference and runtime behavior for:
 * - Array → ArrayHelper
 * - Map → MapHelper
 * - Set → SetHelper
 * - Object → ObjectHelper
 */

import { describe, test, expect } from 'bun:test';
import { produceFast } from './produce-fast';

// ===== Type Definitions for Testing =====

type User = {
  name: string;
  age: number;
  profile: {
    bio: string;
    avatar: string;
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
};

// ===== Array Tests =====

describe('ProduceFast - Array', () => {
  test('ArrayHelper.set - updates element at index', () => {
    const arr = [1, 2, 3];
    const result = produceFast(arr, $ => {
      $.set(0, 100);
      $.set(2, 300);
    });

    expect(result).toEqual([100, 2, 300]);
    expect(result).not.toBe(arr); // New array
  });

  test('ArrayHelper.push - adds elements', () => {
    const arr = [1, 2, 3];
    const result = produceFast(arr, $ => {
      $.push(4, 5, 6);
    });

    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  test('ArrayHelper.splice - removes and inserts', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = produceFast(arr, $ => {
      $.splice(1, 2, 10, 20); // Remove 2 items at index 1, insert 10, 20
    });

    expect(result).toEqual([1, 10, 20, 4, 5]);
  });

  test('ArrayHelper.delete - removes element at index', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = produceFast(arr, $ => {
      $.delete(2); // Remove element at index 2
    });

    expect(result).toEqual([1, 2, 4, 5]);
  });

  test('ArrayHelper.filter - filters elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = produceFast(arr, $ => {
      $.filter(x => x > 2);
    });

    expect(result).toEqual([3, 4, 5]);
  });

  test('Array - multiple mutations', () => {
    const arr = [1, 2, 3];
    const result = produceFast(arr, $ => {
      $.push(4);
      $.set(0, 100);
      $.push(5);
    });

    expect(result).toEqual([100, 2, 3, 4, 5]);
  });

  test('Array - no mutations returns original', () => {
    const arr = [1, 2, 3];
    const result = produceFast(arr, $ => {
      // No mutations
    });

    expect(result).toBe(arr);
  });

  test('Array - typed elements', () => {
    type Item = { id: number; title: string };
    const items: Item[] = [
      { id: 1, title: 'Item 1' },
      { id: 2, title: 'Item 2' }
    ];

    const result = produceFast(items, $ => {
      $.set(0, { id: 10, title: 'Updated' });
      $.push({ id: 3, title: 'Item 3' });
    });

    expect(result).toEqual([
      { id: 10, title: 'Updated' },
      { id: 2, title: 'Item 2' },
      { id: 3, title: 'Item 3' }
    ]);
  });
});

// ===== Map Tests =====

describe('ProduceFast - Map', () => {
  test('MapHelper.set - sets key-value pairs', () => {
    const map = new Map([['a', 1], ['b', 2]]);
    const result = produceFast(map, $ => {
      $.set('a', 100);
      $.set('c', 3);
    });

    expect(result.get('a')).toBe(100);
    expect(result.get('b')).toBe(2);
    expect(result.get('c')).toBe(3);
    expect(result).not.toBe(map);
  });

  test('MapHelper.delete - deletes key', () => {
    const map = new Map([['a', 1], ['b', 2], ['c', 3]]);
    const result = produceFast(map, $ => {
      $.delete('b');
    });

    expect(result.has('b')).toBe(false);
    expect(result.get('a')).toBe(1);
    expect(result.get('c')).toBe(3);
  });

  test('MapHelper.clear - clears all entries', () => {
    const map = new Map([['a', 1], ['b', 2]]);
    const result = produceFast(map, $ => {
      $.clear();
    });

    expect(result.size).toBe(0);
  });

  test('Map - multiple mutations', () => {
    const map = new Map<string, number>();
    const result = produceFast(map, $ => {
      $.set('a', 1);
      $.set('b', 2);
      $.set('c', 3);
      $.delete('b');
    });

    expect(result.size).toBe(2);
    expect(result.get('a')).toBe(1);
    expect(result.get('c')).toBe(3);
  });

  test('Map - no mutations returns original', () => {
    const map = new Map([['a', 1]]);
    const result = produceFast(map, $ => {
      // No mutations
    });

    expect(result).toBe(map);
  });

  test('Map - typed keys and values', () => {
    type UserData = { name: string; age: number };
    const users = new Map<string, UserData>([
      ['user1', { name: 'Alice', age: 30 }]
    ]);

    const result = produceFast(users, $ => {
      $.set('user2', { name: 'Bob', age: 25 });
      $.set('user1', { name: 'Alice Updated', age: 31 });
    });

    expect(result.get('user1')).toEqual({ name: 'Alice Updated', age: 31 });
    expect(result.get('user2')).toEqual({ name: 'Bob', age: 25 });
  });
});

// ===== Set Tests =====

describe('ProduceFast - Set', () => {
  test('SetHelper.add - adds values', () => {
    const set = new Set([1, 2, 3]);
    const result = produceFast(set, $ => {
      $.add(4);
      $.add(5);
    });

    expect(result.has(4)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.size).toBe(5);
    expect(result).not.toBe(set);
  });

  test('SetHelper.delete - deletes value', () => {
    const set = new Set([1, 2, 3]);
    const result = produceFast(set, $ => {
      $.delete(2);
    });

    expect(result.has(2)).toBe(false);
    expect(result.size).toBe(2);
  });

  test('SetHelper.clear - clears all values', () => {
    const set = new Set([1, 2, 3]);
    const result = produceFast(set, $ => {
      $.clear();
    });

    expect(result.size).toBe(0);
  });

  test('Set - multiple mutations', () => {
    const set = new Set<string>();
    const result = produceFast(set, $ => {
      $.add('tag1');
      $.add('tag2');
      $.add('tag3');
      $.delete('tag2');
    });

    expect(result.size).toBe(2);
    expect(result.has('tag1')).toBe(true);
    expect(result.has('tag3')).toBe(true);
  });

  test('Set - no mutations returns original', () => {
    const set = new Set([1, 2, 3]);
    const result = produceFast(set, $ => {
      // No mutations
    });

    expect(result).toBe(set);
  });
});

// ===== Object Tests =====

describe('ProduceFast - Object', () => {
  test('ObjectHelper.set - sets value at path', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.set(['name'], 'Alice');
      $.set(['age'], 30);
    });

    expect(result.name).toBe('Alice');
    expect(result.age).toBe(30);
    expect(result).not.toBe(user);
  });

  test('ObjectHelper.set - sets nested value', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.set(['profile', 'bio'], 'New bio');
      $.set(['profile', 'settings', 'theme'], 'dark');
    });

    expect(result.profile.bio).toBe('New bio');
    expect(result.profile.settings.theme).toBe('dark');
    expect(result.profile.avatar).toBe('url'); // Unchanged
  });

  test('ObjectHelper.update - updates value with function', () => {
    const obj = { count: 10 };
    const result = produceFast(obj, $ => {
      $.update(['count'], x => x + 5);
    });

    expect(result.count).toBe(15);
  });

  test('ObjectHelper.update - updates nested value', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.update(['age'], age => age + 1);
      $.update(['profile', 'settings'], settings => ({
        ...settings,
        notifications: false
      }));
    });

    expect(result.age).toBe(26);
    expect(result.profile.settings.notifications).toBe(false);
    expect(result.profile.settings.theme).toBe('light');
  });

  test('ObjectHelper.delete - deletes property', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = produceFast(obj, $ => {
      $.delete(['b']);
    });

    expect(result).toEqual({ a: 1, c: 3 });
    expect('b' in result).toBe(false);
  });

  test('ObjectHelper.delete - deletes nested property', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.delete(['profile', 'avatar']);
    });

    expect('avatar' in result.profile).toBe(false);
    expect(result.profile.bio).toBe('Hello');
  });

  test('ObjectHelper.merge - merges partial object', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.merge(['profile'], { bio: 'Updated bio' });
    });

    expect(result.profile.bio).toBe('Updated bio');
    expect(result.profile.avatar).toBe('url'); // Unchanged
  });

  test('ObjectHelper.merge - merges nested object', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.merge(['profile', 'settings'], { notifications: false });
    });

    expect(result.profile.settings.notifications).toBe(false);
    expect(result.profile.settings.theme).toBe('light'); // Unchanged
  });

  test('Object - multiple mutations', () => {
    const user: User = {
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
    };

    const result = produceFast(user, $ => {
      $.set(['name'], 'Alice');
      $.update(['age'], age => age + 1);
      $.set(['profile', 'bio'], 'New bio');
      $.merge(['profile', 'settings'], { theme: 'dark' });
    });

    expect(result.name).toBe('Alice');
    expect(result.age).toBe(26);
    expect(result.profile.bio).toBe('New bio');
    expect(result.profile.settings.theme).toBe('dark');
  });

  test('Object - no mutations returns original', () => {
    const obj = { a: 1, b: 2 };
    const result = produceFast(obj, $ => {
      // No mutations
    });

    expect(result).toBe(obj);
  });
});

// ===== Nested Collections Tests =====

describe('ProduceFast - Nested Collections', () => {
  test('Object containing Map', () => {
    type State = {
      users: Map<string, { name: string; age: number }>;
      count: number;
    };

    const state: State = {
      users: new Map([['user1', { name: 'Alice', age: 30 }]]),
      count: 0
    };

    // Update top-level properties
    const result = produceFast(state, $ => {
      $.set(['count'], 1);
      $.update(['users'], users => {
        const newUsers = new Map(users);
        newUsers.set('user2', { name: 'Bob', age: 25 });
        return newUsers;
      });
    });

    expect(result.count).toBe(1);
    expect(result.users.size).toBe(2);
    expect(result.users.get('user2')).toEqual({ name: 'Bob', age: 25 });
  });

  test('Object containing Array', () => {
    type State = {
      items: Array<{ id: number; title: string }>;
      total: number;
    };

    const state: State = {
      items: [{ id: 1, title: 'Item 1' }],
      total: 1
    };

    const result = produceFast(state, $ => {
      $.set(['total'], 2);
      $.update(['items'], items => [...items, { id: 2, title: 'Item 2' }]);
    });

    expect(result.total).toBe(2);
    expect(result.items.length).toBe(2);
    expect(result.items[1]).toEqual({ id: 2, title: 'Item 2' });
  });

  test('Object containing Set', () => {
    type State = {
      tags: Set<string>;
      version: number;
    };

    const state: State = {
      tags: new Set(['tag1', 'tag2']),
      version: 1
    };

    const result = produceFast(state, $ => {
      $.set(['version'], 2);
      $.update(['tags'], tags => {
        const newTags = new Set(tags);
        newTags.add('tag3');
        return newTags;
      });
    });

    expect(result.version).toBe(2);
    expect(result.tags.size).toBe(3);
    expect(result.tags.has('tag3')).toBe(true);
  });
});
