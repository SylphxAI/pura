# ProduceFast 完整设计文档

## 核心理念

**类型驱动的 API 设计**
- 根据输入类型，推导不同的 Helper 接口
- 根据路径/键，推导值的类型
- 完全类型安全，编译时捕获所有错误

---

## API 设计

### 1. Array

```typescript
type Items = Array<{ id: number; title: string }>;
const items: Items = [{ id: 1, title: 'Item 1' }];

produceFast(items, $ => {
  // ✅ 类型推导：value 必须是 { id: number; title: string }
  $.set(0, { id: 2, title: 'New' });

  // ✅ push 参数类型推导
  $.push({ id: 3, title: 'Item 3' });
  $.push({ id: 4, title: 'Item 4' }, { id: 5, title: 'Item 5' });

  // ✅ splice 类型推导
  $.splice(1, 2, { id: 10, title: 'Replaced' });

  // ✅ delete
  $.delete(0);

  // ✅ filter - 返回过滤后的数组
  $.filter((item, index) => item.id > 2);

  // ❌ 类型错误：id 必须是 number
  $.set(0, { id: '2', title: 'New' });

  // ❌ 类型错误：缺少 title
  $.push({ id: 3 });
});
```

**ArrayHelper 接口:**
```typescript
interface ArrayHelper<E> {
  set(index: number, value: E): void;
  delete(index: number): void;
  push(...items: E[]): void;
  splice(start: number, deleteCount?: number, ...items: E[]): void;
  filter(fn: (item: E, index: number) => boolean): void;
}
```

---

### 2. Map

```typescript
type UserMap = Map<string, { name: string; age: number }>;
const users: UserMap = new Map();

produceFast(users, $ => {
  // ✅ 类型推导：key 是 string，value 是 { name: string; age: number }
  $.set('user1', { name: 'Alice', age: 30 });
  $.set('user2', { name: 'Bob', age: 25 });

  // ✅ delete
  $.delete('user1');

  // ✅ clear
  $.clear();

  // ❌ 类型错误：key 必须是 string
  $.set(123, { name: 'Alice', age: 30 });

  // ❌ 类型错误：age 必须是 number
  $.set('user1', { name: 'Alice', age: '30' });

  // ❌ 类型错误：缺少 age
  $.set('user1', { name: 'Alice' });
});
```

**MapHelper 接口:**
```typescript
interface MapHelper<K, V> {
  set(key: K, value: V): void;
  delete(key: K): void;
  clear(): void;
}
```

---

### 3. Set

```typescript
type Tags = Set<string>;
const tags: Tags = new Set(['tag1', 'tag2']);

produceFast(tags, $ => {
  // ✅ 类型推导：value 必须是 string
  $.add('tag3');
  $.add('tag4');

  // ✅ delete
  $.delete('tag1');

  // ✅ clear
  $.clear();

  // ❌ 类型错误：value 必须是 string
  $.add(123);
});
```

**SetHelper 接口:**
```typescript
interface SetHelper<V> {
  add(value: V): void;
  delete(value: V): void;
  clear(): void;
}
```

---

### 4. Object

```typescript
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

produceFast(user, $ => {
  // ✅ 类型推导：从路径推导值类型
  $.set(['name'], 'Alice');                          // value: string
  $.set(['age'], 30);                                // value: number
  $.set(['profile', 'bio'], 'New bio');             // value: string
  $.set(['profile', 'settings', 'theme'], 'dark');  // value: 'light' | 'dark'

  // ✅ update - 类型推导 old 和返回值
  $.update(['age'], age => {
    // age 推导为 number
    return age + 1;
  });

  $.update(['profile', 'settings'], settings => {
    // settings 推导为 { theme: 'light' | 'dark'; notifications: boolean }
    return {
      ...settings,
      notifications: false
    };
  });

  // ✅ delete
  $.delete(['profile', 'avatar']);

  // ✅ merge - 部分更新
  $.merge(['profile'], {
    bio: 'Updated bio'
    // avatar 可选
  });

  // ❌ 类型错误：name 必须是 string
  $.set(['name'], 123);

  // ❌ 类型错误：age 必须是 number
  $.set(['age'], '30');

  // ❌ 类型错误：theme 必须是 'light' | 'dark'
  $.set(['profile', 'settings', 'theme'], 'blue');

  // ❌ 类型错误：路径不存在
  $.set(['notExist'], 'value');

  // ❌ 类型错误：路径不存在
  $.set(['profile', 'notExist'], 'value');

  // ❌ update 返回类型错误
  $.update(['age'], age => {
    return '30';  // 必须返回 number
  });
});
```

**ObjectHelper 接口:**
```typescript
interface ObjectHelper<T> {
  set<P extends PathArray<T>>(
    path: P,
    value: PathValue<T, P>  // 🔑 从路径推导值类型
  ): void;

  update<P extends PathArray<T>>(
    path: P,
    updater: (old: PathValue<T, P>) => PathValue<T, P>  // 🔑 类型推导
  ): void;

  delete<P extends PathArray<T>>(path: P): void;

  merge<P extends PathArray<T>>(
    path: P,
    value: Partial<PathValue<T, P>>  // 🔑 部分类型
  ): void;
}
```

---

## 嵌套集合处理

### 问题：Object 包含 Map/Set/Array

```typescript
type State = {
  users: Map<string, User>;
  items: Array<Item>;
  tags: Set<string>;
  config: {
    name: string;
  };
};

const state: State = {
  users: new Map(),
  items: [],
  tags: new Set(),
  config: { name: 'App' }
};
```

### 方案 1: 路径只到集合边界

```typescript
produceFast(state, $ => {
  // ✅ 可以替换整个集合
  $.set(['users'], new Map([
    ['user1', { name: 'Alice', age: 30 }]
  ]));

  $.set(['items'], [{ id: 1, title: 'Item 1' }]);

  $.set(['tags'], new Set(['tag1', 'tag2']));

  // ✅ 可以 update 集合
  $.update(['users'], users => {
    const newUsers = new Map(users);
    newUsers.set('user1', { name: 'Alice', age: 30 });
    return newUsers;
  });

  $.update(['items'], items => {
    return [...items, { id: 2, title: 'Item 2' }];
  });

  $.update(['tags'], tags => {
    const newTags = new Set(tags);
    newTags.add('tag3');
    return newTags;
  });

  // ✅ 普通对象路径继续深入
  $.set(['config', 'name'], 'New App');

  // ❌ 路径不能深入到集合内部
  // $.set(['users', 'user1'], userData);  // 不支持
  // $.set(['items', 0], item);            // 不支持
  // $.set(['tags', 'tag1'], ...);         // 不支持
});
```

**路径类型定义:**
```typescript
type PathArray<T, D extends number = 5> =
  [D] extends [never] ? never :
  T extends Map<any, any> | Set<any> | Array<any>
    ? []  // 🔑 集合类型：路径到此为止
    : T extends object
      ? {
          [K in keyof T]:
            | [K]
            | (PathArray<T[K], Prev[D]> extends infer R
                ? R extends [any, ...any[]]
                  ? [K, ...R]
                  : never
                : never)
        }[keyof T]
      : never;
```

### 方案 2: 分别操作

```typescript
// 先提取嵌套集合
const users = state.users;

// 然后单独操作
produceFast(users, $ => {
  $.set('user1', { name: 'Alice', age: 30 });
  $.delete('user2');
});

// 再更新回去
produceFast(state, $ => {
  $.set(['users'], users);
});
```

### 方案 3: 支持深入（复杂，不推荐）

```typescript
// 需要特殊的路径类型支持 Map key
$.set(['users', 'user1' as MapKey], userData);
$.set(['items', 0 as ArrayIndex], item);

// 类型复杂度爆炸，不推荐
```

---

## 类型推导核心

```typescript
// 🔑 根据输入类型，推导 Helper 类型
type FastHelper<T> =
  T extends Array<infer E> ? ArrayHelper<E> :
  T extends Map<infer K, infer V> ? MapHelper<K, V> :
  T extends Set<infer V> ? SetHelper<V> :
  T extends object ? ObjectHelper<T> :
  never;

// 🔑 递归生成所有可能的路径
type PathArray<T, D extends number = 5> = ...;

// 🔑 从路径提取值类型
type PathValue<T, P extends readonly any[]> =
  P extends readonly [infer K, ...infer Rest]
    ? K extends keyof T
      ? Rest extends readonly []
        ? T[K]  // 🔑 最后一个元素，返回值类型
        : PathValue<T[K], Rest>  // 🔑 递归
      : never
    : T;

// 🔑 ProduceFast 函数签名
function produceFast<T>(
  base: T,
  recipe: (helper: FastHelper<T>) => void
): T;
```

---

## 性能目标

| 场景 | 性能目标 | 对比 |
|------|---------|------|
| 单次更新 | ~1.1-1.5x slower than native | vs Produce ~2-3x |
| 多次更新 | ~1.2-1.8x slower than native | vs Produce ~1.5-2.5x |

**关键：优化批量应用 mutations，避免重复复制**

---

## 实现策略

### 运行时类型检测

```typescript
function produceFast<T>(
  base: T,
  recipe: (helper: FastHelper<T>) => void
): T {
  // 运行时检测类型
  if (Array.isArray(base)) {
    return produceFastArray(base as any, recipe as any);
  } else if (base instanceof Map) {
    return produceFastMap(base as any, recipe as any);
  } else if (base instanceof Set) {
    return produceFastSet(base as any, recipe as any);
  } else if (typeof base === 'object' && base !== null) {
    return produceFastObject(base, recipe as any);
  }

  throw new Error('Unsupported type');
}
```

### 批量应用优化

```typescript
// 收集所有 mutations
const mutations: Mutation[] = [];

// 一次性应用（关键优化）
function applyMutations<T>(base: T, mutations: Mutation[]): T {
  // TODO: 智能合并 mutations，最小化复制
  // 分析路径重叠，只复制必要的部分
}
```

---

## 下一步

1. ✅ 完成文档
2. ⏳ 实现 Array/Map/Set/Object 各自的 produceFast
3. ⏳ 优化批量应用 mutations
4. ⏳ 完整的类型测试
5. ⏳ 性能 benchmark
6. ⏳ 与 produce 对比测试
