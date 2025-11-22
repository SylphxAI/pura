# API Reference

Complete API reference for Pura's immutable data structures.

## Core Functions

### Primary APIs

| Function | Purpose | Use Case |
|----------|---------|----------|
| [`produceFast()`](/api/produce-fast) | Optimized helper-based mutations | New code, maximum performance |
| [`produce()`](/api/produce) | Immer-compatible proxy mutations | Migrating from Immer, prefer mutation syntax |

### Utility Functions

| Function | Purpose | Use Case |
|----------|---------|----------|
| [`pura()`](/api/pura) | Wrap value in persistent structure | Rarely needed - produce/produceFast auto-convert |
| [`unpura()`](/api/unpura) | Convert to native JavaScript | Third-party libraries, hot loops |
| [`isPura()`](/api/is-pura) | Check if value is Pura proxy | Type checking, debugging |

## Quick Start

### produceFast() - Recommended

```typescript
import { produceFast } from 'pura'

const next = produceFast(state, $ => {
  $.set(['items', 0], 999)    // Helper-based API
  $.push(4)                    // Array methods
  $.set(['user', 'name'], 'Jane')
})
```

**Best for:** New code, performance-critical paths

### produce() - Immer-Compatible

```typescript
import { produce } from 'pura'

const next = produce(state, draft => {
  draft.items[0] = 999        // Direct mutation
  draft.items.push(4)          // Array methods
  draft.user.name = 'Jane'     // Deep updates
})
```

**Best for:** Migrating from Immer, prefer mutation syntax

## Helper APIs (produceFast)

### ArrayHelper

```typescript
interface ArrayHelper<E> {
  set(index: number, value: E): void
  delete(index: number): void
  push(...items: E[]): void
  pop(): E | undefined
  unshift(...items: E[]): void
  shift(): E | undefined
  splice(start: number, deleteCount?: number, ...items: E[]): void
  reverse(): void
  sort(compareFn?: (a: E, b: E) => number): void
  fill(value: E, start?: number, end?: number): void
  copyWithin(target: number, start: number, end?: number): void
  filter(fn: (item: E, index: number) => boolean): E[]  // Must return!
  map<U>(fn: (item: E, index: number) => U): U[]  // Must return!
}
```

### ObjectHelper

```typescript
interface ObjectHelper<T> {
  set<P extends Path>(path: P, value: PathValue<T, P>): void
  update<P extends Path>(path: P, updater: (old: PathValue<T, P>) => PathValue<T, P>): void
  delete<P extends Path>(path: P): void
  merge<P extends Path>(path: P, value: Partial<PathValue<T, P>>): void
}
```

### MapHelper

```typescript
interface MapHelper<K, V> {
  set(key: K, value: V): void
  delete(key: K): void
  clear(): void
  has(key: K): boolean
}
```

### SetHelper

```typescript
interface SetHelper<V> {
  add(value: V): void
  delete(value: V): void
  clear(): void
  has(value: V): boolean
}
```

## Type Safety

Perfect TypeScript inference across all APIs:

```typescript
interface User {
  name: string
  age: number
}

const user: User = { name: 'John', age: 30 }

// produceFast - type-safe paths
const next1 = produceFast(user, $ => {
  $.set(['age'], 31)        // ✅ Valid
  $.set(['invalid'], 'x')   // ❌ Type error
  $.set(['age'], 'x')       // ❌ Type error
})

// produce - type-safe mutations
const next2 = produce(user, draft => {
  draft.age = 31            // ✅ Valid
  draft.invalid = 'x'       // ❌ Type error
  draft.age = 'x'           // ❌ Type error
})
```

## Performance Comparison

| API | vs Immer | vs Manual | Use Case |
|-----|----------|-----------|----------|
| **produceFast()** | 1.06-105× faster | Faster for large (512+) | Maximum performance |
| **produce()** | 1.06-105× faster | Faster for large (512+) | Immer migration |
| **Native** | - | Fastest for small (<512) | Shallow updates |

See [Performance Guide](/guide/performance) for optimization tips.

## Adaptive Strategy

Pura automatically chooses representation based on size:

| Size | Representation | API Overhead |
|------|---------------|--------------|
| **<512 elements** | Native JavaScript | Zero (uses native operations) |
| **>=512 elements** | Persistent tree (RRB-Tree/HAMT) | O(log n) structural sharing |

See [Understanding Adaptive Strategy](/guide/understanding-adaptive) for details.

## Common Patterns

### Redux Reducer

```typescript
import { produceFast } from 'pura'

const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return produceFast(state, $ => $.push(action.payload))

    case 'UPDATE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.id) {
            $.set([i, 'text'], action.text)
            break
          }
        }
      })

    default:
      return state
  }
}
```

### React State

```typescript
import { produceFast } from 'pura'
import { useState } from 'react'

function TodoApp() {
  const [todos, setTodos] = useState([])

  const addTodo = (text) => {
    setTodos(current =>
      produceFast(current, $ => {
        $.push({ id: Date.now(), text, completed: false })
      })
    )
  }

  return (/* ... */)
}
```

### Zustand Store

```typescript
import { create } from 'zustand'
import { produceFast } from 'pura'

const useStore = create((set) => ({
  items: [],

  addItem: (item) => set((state) => ({
    items: produceFast(state.items, $ => $.push(item))
  }))
}))
```

## Migration from Immer

**Step 1:** Change import

```typescript
// Before
import { produce } from 'immer'

// After
import { produce } from 'pura'
```

**Step 2 (optional):** Upgrade to `produceFast()` for maximum performance

```typescript
import { produceFast } from 'pura'

// Before (Immer)
const next = produce(state, draft => {
  draft.items[0] = 999
})

// After (Pura produceFast)
const next = produceFast(state, $ => {
  $.set(['items', 0], 999)
})
```

See [Migration Guide](/guide/migration-from-immer) for complete migration steps.

## API by Use Case

### When to Use Each Function

**produceFast()**
- New code
- Performance-critical paths
- Clear, explicit updates
- Type-safe path-based access

**produce()**
- Migrating from Immer
- Prefer mutation syntax
- Complex nested logic
- Existing Immer codebase

**pura()**
- Rarely needed
- Manual wrapping (produce/produceFast auto-convert)
- Pre-wrapping for reuse

**unpura()**
- Third-party libraries expecting native
- Performance-critical hot loops
- Serialization (optional - Pura serializes natively)
- Explicit type checks

**isPura()**
- Type checking
- Debugging
- Conditional logic based on representation

## Next Steps

- [produceFast() API](/api/produce-fast) - Helper-based API reference
- [produce() API](/api/produce) - Immer-compatible API reference
- [Performance Guide](/guide/performance) - Optimization tips
- [Examples](/examples/arrays) - Real-world usage patterns
