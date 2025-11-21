# Adaptive Optimization Design

## 目标

- **小数据**（< 512）：用原生结构，零 overhead
- **大数据**（>= 512）：用持久化结构，structural sharing
- **性能优先**：避免不必要的转换

## 核心原则

1. **pura()**: 小→native copy，大→proxy
2. **produce()**: draft 永远用 proxy，但内部分两种模式
3. **不转换**: native 小数组不转 Vec 再转回
4. **行为一致**: proxy 和 native 行为完全一样

---

## Threshold

```typescript
const ADAPTIVE_THRESHOLD = 512;
```

所有类型统一使用此阈值。

---

## Array 设计

### PuraArrayState (Dual Mode)

```typescript
type PuraArrayState<T> =
  | NativeArrayState<T>
  | TreeArrayState<T>;

interface NativeArrayState<T> {
  mode: 'native';
  data: T[];              // 普通数组
  isDraft: boolean;
  modified: boolean;
  proxies?: Map<number, any>;  // 嵌套对象的 proxy
}

interface TreeArrayState<T> {
  mode: 'tree';
  vec: Vec<T>;            // RRB-tree
  isDraft: boolean;
  owner?: Owner;
  modified: boolean;
  proxies?: Map<number, any>;
  cachedLeaf?: T[];
  cachedLeafStart?: number;
}
```

### pura() - Array

```typescript
export function pura<T>(arr: T[]): T[] {
  // 已经是 pura array？
  if (ARRAY_STATE_ENV.has(arr)) return arr;

  // 小数组：返回 native copy
  if (arr.length < ADAPTIVE_THRESHOLD) {
    return arr.slice();
  }

  // 大数组：返回 tree proxy
  const vec = vecFromArray(arr);
  return createArrayProxy({ mode: 'tree', vec, isDraft: false, ... });
}
```

### produce() - Array

```typescript
export function produceArray<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  const baseState = ARRAY_STATE_ENV.get(base);

  // Case 1: native 小数组
  if (!baseState && base.length < THRESHOLD) {
    const draftState: NativeArrayState<T> = {
      mode: 'native',
      data: base.slice(),  // shallow copy
      isDraft: true,
      modified: false,
    };
    const draft = createArrayProxy(draftState);
    recipe(draft);

    if (!draftState.modified) return base;

    // 结果还小？返回 native
    if (draftState.data.length < THRESHOLD) {
      return draftState.data;
    }
    // 结果变大？升级到 tree proxy
    const vec = vecFromArray(draftState.data);
    return createArrayProxy({ mode: 'tree', vec, isDraft: false, ... });
  }

  // Case 2: native 大数组 or tree proxy
  // 转换为 tree mode 并使用 transient
  const baseVec = baseState
    ? (baseState.mode === 'tree' ? baseState.vec : vecFromArray(baseState.data))
    : vecFromArray(base);

  const draftState: TreeArrayState<T> = {
    mode: 'tree',
    vec: { ...baseVec },  // shallow copy for transient
    isDraft: true,
    owner: {},
    modified: false,
  };
  const draft = createArrayProxy(draftState);
  recipe(draft);

  if (!draftState.modified) return base;

  // 结果变小？降级到 native
  if (draftState.vec.count < THRESHOLD) {
    return vecToArray(draftState.vec);
  }
  // 结果还大？返回 tree proxy
  return createArrayProxy({ mode: 'tree', vec: draftState.vec, isDraft: false, ... });
}
```

### createArrayProxy() - 处理两种模式

```typescript
export function createArrayProxy<T>(state: PuraArrayState<T>): T[] {
  const proxy = new Proxy([], {
    get(target, prop) {
      if (prop === 'length') {
        return state.mode === 'native'
          ? state.data.length
          : state.vec.count;
      }

      // 数字索引
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = Number(prop);
        if (state.mode === 'native') {
          return state.data[index];
        } else {
          return vecGet(state.vec, index);
        }
      }

      // 方法（需要分别处理两种模式）
      // ...
    },

    set(target, prop, value) {
      if (state.mode === 'native') {
        // Native mode: 直接设置
        if (state.isDraft) {
          if (typeof prop === 'string' && /^\d+$/.test(prop)) {
            const index = Number(prop);
            state.data[index] = value;
            state.modified = true;
            return true;
          }
        }
      } else {
        // Tree mode: 使用 vecAssoc
        if (state.isDraft) {
          if (typeof prop === 'string' && /^\d+$/.test(prop)) {
            const index = Number(prop);
            state.vec = vecAssoc(state.vec, state.owner!, index, value);
            state.modified = true;
            return true;
          }
        }
      }
      return false;
    },
  });

  ARRAY_STATE_ENV.set(proxy, state);
  return proxy;
}
```

---

## Map/Set 设计

类似 Array 的 dual-mode 策略：

### Native mode
- 小 Map/Set (< 512)：用普通 Map/Set + copy-on-write
- produce() 不转 HAMT

### Tree mode
- 大 Map/Set (>= 512)：用 HAMT + OrderIndex
- structural sharing

---

## Object 设计

Object 已有 nested proxy 机制，不需要大改：
- 小对象 (< 512 props)：pura() 返回 shallow copy
- 大对象：pura() 返回 nested proxy
- produce() 统一用 nested proxy（支持深层 COW）

---

## 性能优化点

### ✅ 避免的转换
- native 小数组 → **不转 Vec** → native（直接用 copy）
- native 小 Map → **不转 HAMT** → native
- native 小 Set → **不转 HAMT** → native

### ✅ 保留的优化
- 大数据的 structural sharing（Vec/HAMT）
- Transient mutations（owner-based COW）
- 缓存优化（cached leaf nodes）

---

## 实现步骤

1. ✅ 定义 THRESHOLD = 512
2. ✅ 移除 puraOrderedMap/Set（统一 ordered）
3. ⏳ 实现 dual-mode PuraArrayState
4. ⏳ 修改 createArrayProxy 支持两种模式
5. ⏳ 修改 produceArray 实现三种策略
6. ⏳ 同样策略应用到 Map/Set
7. ⏳ 测试验证行为一致性
8. ⏳ Benchmark 验证性能提升

---

## 测试策略

### 功能测试
- [ ] 小数组 produce 正确处理嵌套对象
- [ ] 大数组 produce 使用 structural sharing
- [ ] 小→大升级正确
- [ ] 大→小降级正确
- [ ] 引用相等性（无修改返回同一引用）

### 性能测试
- [ ] 小数组（< 512）性能接近 native
- [ ] 大数组（> 512）性能优于 native copy
- [ ] 无 Vec 转换 overhead

---

## 限制和注意事项

### isPura() 行为变化
- 小数组经过 pura() 后是 native，isPura() 返回 false
- 这是可以接受的，因为行为上和 native 一致

### 兼容性
- 所有 API 保持不变
- 用户代码无需修改
- 只是内部优化

### 文档更新
- 说明自适应优化机制
- 建议小数据用 native，大数据用 pura
