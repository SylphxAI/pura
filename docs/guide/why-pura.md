# Why Pura?

Pura makes Pure Functional Programming **the default choice** for TypeScript developers.

## The Problem with Immutability

Traditional immutable updates in JavaScript are slow and verbose:

```typescript
// ❌ Manual immutable update (slow, error-prone)
const updatedState = {
  ...state,
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      settings: {
        ...state.user.profile.settings,
        theme: 'dark'
      }
    }
  }
}

// ❌ Array updates require full copies
const updatedArray = [
  ...state.items.slice(0, 500),
  newValue,
  ...state.items.slice(501)
]
```

**Problems:**
- **O(n) complexity**: Full copies for every update
- **Memory inefficient**: Entire structure copied
- **Error-prone**: Easy to forget spread operators
- **Verbose**: Deep updates require nested spreads

## The Pura Solution

Pura uses **persistent data structures** to make immutability fast:

```typescript
// ✅ Pura (fast, concise, safe)
import { produceFast } from 'pura'

const updatedState = produceFast(state, $ => {
  $.set(['user', 'profile', 'settings', 'theme'], 'dark')
})

const updatedArray = produceFast(state.items, $ => {
  $.set(500, newValue)
})
```

**Benefits:**
- **O(log n) complexity**: Only copies changed path
- **Structural sharing**: Unchanged parts reused
- **Type-safe**: Full TypeScript inference
- **Concise**: Clean, readable syntax

## Performance Comparison

### vs Immer

Pura is **1.06-105x faster** than Immer across all scenarios:

| Scenario | Immer | Pura | Speedup |
|----------|-------|------|---------|
| **Sets (1K)** | 2.31K ops/s | **243K ops/s** | **105x faster** 🚀 |
| **Maps (1K)** | 2.08K ops/s | **25.1K ops/s** | **12x faster** 🚀 |
| **Objects (Deep)** | 681K ops/s | **1.70M ops/s** | **2.5x faster** ✅ |
| **Arrays (100)** | 0.87M ops/s | **4.63M ops/s** | **5.3x faster** ✅ |

**Why faster?**
- **Persistent structures**: Arrays/Maps/Sets use HAMT/RRB-Trees (Immer only optimizes objects)
- **Helper API**: `produceFast()` avoids proxy overhead for mutations
- **Adaptive strategy**: Small collections use native (zero overhead)

### vs Manual Immutability

For a 10,000-element array, updating index 500:

| Approach | Complexity | Operations |
|----------|-----------|------------|
| **Manual spread** | O(n) | Copy 10,000 elements |
| **Pura** | O(log₃₂ n) | Update ~4 tree nodes |

**Result**: Pura is faster at ~5,000+ elements.

### vs Immutable.js

| Feature | Immutable.js | Pura |
|---------|-------------|------|
| **API** | Separate (`.get()`, `.set()`) | Native JavaScript |
| **TypeScript** | Poor inference | Perfect inference |
| **Bundle size** | ~16KB gzipped | <8KB gzipped |
| **Tree-shaking** | Poor | Excellent |
| **Learning curve** | Steep | Minimal |

## Key Features

### 1. Two APIs - Choose Your Style

**`produce()` - Immer-Compatible**

```typescript
import { produce } from 'pura'

const next = produce(state, draft => {
  draft.items[0] = 999        // Direct mutation
  draft.user.name = 'Jane'    // Just like Immer
})
```

Use when:
- Migrating from Immer
- Prefer mutation syntax
- Complex nested logic

**`produceFast()` - Optimized** (Recommended)

```typescript
import { produceFast } from 'pura'

const next = produceFast(state, $ => {
  $.set(['items', 0], 999)    // Helper-based
  $.set(['user', 'name'], 'Jane')
})
```

Use when:
- Maximum performance (1.06-105x faster than Immer)
- Clear, explicit updates
- New projects

### 2. Adaptive Strategy

Automatically chooses the best representation:

```typescript
// Small array (< 512) → native copy (zero overhead)
const small = [1, 2, 3]
const result = produceFast(small, $ => $.push(4))
// result is a native array - no persistent structure overhead!

// Large array (>= 512) → persistent tree (structural sharing)
const large = Array.from({ length: 1000 }, (_, i) => i)
const result = produceFast(large, $ => $.set(500, 999))
// result uses RRB-Tree - only ~4 nodes copied!
```

**You don't need to think about this** - it's automatic!

### 3. Structural Sharing

Unchanged parts of data structures are **reused**, not copied:

```typescript
const state = {
  users: Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `User ${i}` })),
  settings: { theme: 'light' }
}

const next = produceFast(state, $ => {
  $.set(['settings', 'theme'], 'dark')
})

// Only 'settings' object is copied
// 'users' array (10,000 items) is reused unchanged!
console.log(state.users === next.users)  // true
```

### 4. Type Safety

Perfect TypeScript inference:

```typescript
interface State {
  user: {
    name: string
    age: number
  }
}

const state: State = {
  user: { name: 'John', age: 30 }
}

const next = produceFast(state, $ => {
  $.set(['user', 'age'], 31)      // ✅ Type-safe
  $.set(['user', 'invalid'], 'x') // ❌ Type error!
  $.set(['user', 'age'], 'x')     // ❌ Type error!
})

// next has type State
```

### 5. Zero Dependencies

**<8KB gzipped** core with excellent tree-shaking:

```typescript
// Only imports what you use
import { produceFast } from 'pura'  // ~3KB
import { produce } from 'pura'      // ~5KB
```

No runtime dependencies. No bloat.

## When to Use Pura

### ✅ Perfect For

- **State management** (Redux, Zustand, Jotai)
- **React/Vue/Svelte** state updates
- **API responses** transformation
- **Data processing** pipelines
- **Migrating from Immer** (drop-in replacement)

### ⚠️ Consider Alternatives

- **Shallow updates**: Native spread is simpler
  ```typescript
  // For this, use native
  const next = { ...state, field: value }
  ```

- **Performance-critical hot loops**: Use mutable structures, freeze after
  ```typescript
  // Build mutable, then freeze
  const arr = []
  for (let i = 0; i < 10000; i++) arr.push(compute(i))
  return Object.freeze(arr)
  ```

- **Already using Immer with no issues**: Migration is easy, but not urgent

## Philosophy

> **Pure FP shouldn't be a compromise. It should be the default.**

Pura makes immutable updates:
- **Faster** than naive mutation (structural sharing)
- **Safer** than manual spreads (impossible to mutate)
- **Easier** than Immutable.js (native API)
- **Lighter** than alternatives (<8KB)

**Pure as it should be.** 🌊

## Next Steps

- [Getting Started](/guide/getting-started) - Install and first steps
- [produceFast() API](/guide/produce-fast-api) - Recommended API
- [Migration from Immer](/guide/migration-from-immer) - Easy migration
- [Examples](/examples/arrays) - Real-world usage
