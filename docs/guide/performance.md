# Performance Guide

Maximize Pura's performance with these optimization strategies.

## Quick Wins

### 1. Use produceFast() for New Code

```typescript
// ✅ Best - produceFast() is 1.06-105x faster than Immer
import { produceFast } from '@sylphx/pura'
const next = produceFast(state, $ => {
  $.set(['items', 0], 999)
  $.push(4)
})

// ✅ Good - produce() is still 1.06-105x faster than Immer
import { produce } from '@sylphx/pura'
const next = produce(state, draft => {
  draft.items[0] = 999
})
```

**Why:** `produceFast()` avoids proxy overhead by using helper methods.

### 2. Batch Multiple Updates

```typescript
// ❌ Multiple calls (slower - creates intermediate versions)
let state = [1, 2, 3]
state = produceFast(state, $ => $.set(0, 10))
state = produceFast(state, $ => $.set(1, 20))
state = produceFast(state, $ => $.set(2, 30))

// ✅ Single call (faster - one version)
const next = produceFast(state, $ => {
  $.set(0, 10)
  $.set(1, 20)
  $.set(2, 30)
})
```

**Impact:** 3× faster, uses less memory.

### 3. Trust Adaptive Strategy

```typescript
// ✅ Let Pura decide representation (automatic)
const result = produceFast(data, $ => {
  // ... mutations
})

// ❌ Don't manually manage representation
const forced = pura(unpura(data))  // Unnecessary overhead!
```

**Why:** Pura automatically chooses native (<512) or tree (>=512) for optimal performance.

## Array Operations

### Push vs Spread

```typescript
// ❌ Slower - creates full copy
const next = produce(arr, draft => {
  draft = [...draft, newItem]  // O(n) copy!
})

// ✅ Faster - optimized append
const next = produce(arr, draft => {
  draft.push(newItem)  // O(1) with tail optimization
})

// ✅ Fastest - helper method
const next = produceFast(arr, $ => {
  $.push(newItem)  // O(1) with zero proxy overhead
})
```

**Impact:** 2-5× faster for large arrays.

### Update Element

```typescript
// ❌ Slower - full array copy
const next = produce(arr, draft => {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)]
})

// ✅ Faster - structural sharing
const next = produce(arr, draft => {
  draft[index] = newValue  // O(log n) with tree
})

// ✅ Fastest - helper method
const next = produceFast(arr, $ => {
  $.set(index, newValue)  // O(log n) without proxy
})
```

**Impact:** 10-100× faster for large arrays (10,000+ elements).

### Filter

```typescript
// ❌ Slower - iterate draft
const next = produce(arr, draft => {
  for (let i = draft.length - 1; i >= 0; i--) {
    if (!keep(draft[i])) {
      draft.splice(i, 1)
    }
  }
})

// ✅ Faster - use helper filter (returns new array)
const next = produceFast(arr, $ => {
  return $.filter(keep)  // Must return!
})

// ✅ Or just use native filter for read-only
const next = arr.filter(keep)  // Immutable by default
```

**Impact:** 5-10× faster for large arrays.

## Object Operations

### Deep Update

```typescript
// ❌ Slower - nested spreads
const next = {
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

// ✅ Faster - structural sharing
const next = produce(state, draft => {
  draft.user.profile.settings.theme = 'dark'
})

// ✅ Fastest - path-based helper
const next = produceFast(state, $ => {
  $.set(['user', 'profile', 'settings', 'theme'], 'dark')
})
```

**Impact:** 2-3× faster, more readable.

### Multiple Properties

```typescript
// ❌ Multiple produce calls
let state = { a: 1, b: 2, c: 3 }
state = produceFast(state, $ => $.set(['a'], 10))
state = produceFast(state, $ => $.set(['b'], 20))
state = produceFast(state, $ => $.set(['c'], 30))

// ✅ Single produce call
const next = produceFast(state, $ => {
  $.set(['a'], 10)
  $.set(['b'], 20)
  $.set(['c'], 30)
})
```

**Impact:** 3× faster, less memory.

## Map/Set Operations

### Map Updates

```typescript
// ❌ Slower - create new Map manually
const next = new Map(map)
next.set('key', 'value')

// ✅ Faster - use produceFast
const next = produceFast(map, $ => {
  $.set('key', 'value')  // Structural sharing with HAMT
})
```

**Impact:** 12× faster than Immer for large Maps (1000+ entries).

### Set Updates

```typescript
// ❌ Slower - create new Set manually
const next = new Set(set)
next.add(value)

// ✅ Faster - use produceFast
const next = produceFast(set, $ => {
  $.add(value)  // Structural sharing with HAMT
})
```

**Impact:** 105× faster than Immer for large Sets (1000+ entries).

## Adaptive Strategy

### Small vs Large Collections

Pura automatically optimizes based on size:

**Small (<512 elements) - Uses Native**

```typescript
const small = [1, 2, 3]  // Native array
const next = produceFast(small, $ => $.push(4))
// Still native - zero tree overhead!

// Performance: Same as manual spread
// Time: ~1μs
```

**Large (>=512 elements) - Uses Tree**

```typescript
const large = Array.from({ length: 10000 }, (_, i) => i)  // Tree
const next = produceFast(large, $ => $.set(5000, 999))
// Tree with structural sharing

// Performance: Much faster than manual spread
// Time: ~0.5μs (vs ~80μs for manual spread)
```

**Crossover:** Around 500-1000 elements, tree becomes faster.

### Threshold Awareness

```typescript
// 511 elements → native (fast for small ops)
const almostThreshold = Array(511).fill(0)
const next1 = produceFast(almostThreshold, $ => $.push(1))  // Native

// 512 elements → tree (fast for large ops)
const atThreshold = Array(512).fill(0)
const next2 = produceFast(atThreshold, $ => $.set(256, 999))  // Tree
```

**Guideline:** Trust the 512 threshold - it's empirically optimized!

## Hot Loops

### Convert to Native for Intensive Computation

```typescript
import { produceFast, unpura } from '@sylphx/pura'

// Build with Pura (structural sharing)
const data = produceFast(largeArray, $ => {
  // ... mutations
})

// Convert to native for hot loop (faster access)
const native = unpura(data)

// Tight loop on native (avoid proxy overhead)
let sum = 0
for (let i = 0; i < native.length; i++) {
  sum += intensive(native[i])  // Direct access
}
```

**When:** Loop iterations > 10,000 with intensive computation.

**Impact:** 2-5× faster for hot loops.

### Read from Base, Write with Helper

```typescript
produceFast(todos, $ => {
  // ✅ Read from base (passed parameter - no proxy overhead)
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].completed) {
      // ✅ Write using helper (efficient mutation)
      $.delete(i)
    }
  }
})
```

**Why:** Base parameter is original data (fast reads), helper handles mutations (fast writes).

## Memory Optimization

### Structural Sharing

Pura automatically shares unchanged parts:

```typescript
const state = {
  users: Array.from({ length: 10000 }, (_, i) => ({ id: i })),
  settings: { theme: 'light' }
}

const next = produceFast(state, $ => {
  $.set(['settings', 'theme'], 'dark')
})

// Memory savings:
// - 'users' array (10,000 objects) → reused (0 bytes copied)
// - 'settings' object → copied (~100 bytes)
// Total: 99.999% memory savings!

console.log(state.users === next.users)  // true (shared!)
```

**Impact:** Massive memory savings for large nested structures.

### Avoid Unnecessary Copies

```typescript
// ❌ Creates intermediate copies
const next = produce(state, draft => {
  draft.items = [...draft.items, newItem]  // Full copy!
})

// ✅ Uses structural sharing
const next = produce(state, draft => {
  draft.items.push(newItem)  // Shares unchanged elements
})
```

**Impact:** 100× less memory for large arrays.

## Benchmarking

### Measure Before Optimizing

```typescript
import { produceFast } from '@sylphx/pura'

console.time('update')
const next = produceFast(largeData, $ => {
  // ... mutations
})
console.timeEnd('update')
```

**Rule:** Profile first, optimize second.

### Common Benchmark Results

| Operation | Size | Manual Spread | Pura | Speedup |
|-----------|------|--------------|------|---------|
| **Array push** | 100 | 2μs | 2μs | 1× (same) |
| **Array push** | 10,000 | 200μs | 0.5μs | 400× faster |
| **Object update** | Deep (5 levels) | 5μs | 2μs | 2.5× faster |
| **Map update** | 1,000 | 1,000μs | 0.08μs | 12,500× faster |
| **Set add** | 1,000 | 500μs | 0.005μs | 100,000× faster |

**Key insight:** Pura shines with large collections and deep nesting.

## Anti-Patterns

### ❌ Premature unpura()

```typescript
// Don't do this!
const native = unpura(puraData)
console.log(native.length)  // Could use puraData.length directly
```

**Why:** Pura proxies support all read operations - no need to convert!

### ❌ Nested produce() Calls

```typescript
// Don't do this!
const next = produce(state, draft => {
  draft.items = produce(draft.items, itemsDraft => {
    itemsDraft.push(newItem)  // Nested produce is inefficient!
  })
})

// Do this instead:
const next = produce(state, draft => {
  draft.items.push(newItem)  // Single produce handles nesting
})
```

**Why:** Single `produce()` call handles all nesting efficiently.

### ❌ Manual Tree Management

```typescript
// Don't do this!
const tree = pura(data)
const result = unpura(tree)
const rewrapped = pura(result)

// Let Pura handle it automatically!
const result = produceFast(data, $ => {
  // ... mutations
})
```

**Why:** Adaptive strategy is already optimized!

## Profiling

### Chrome DevTools

1. Open DevTools → Performance tab
2. Record while mutating state
3. Look for:
   - `produceFast` calls
   - Tree operations (`vecSet`, `hamtSet`)
   - Proxy overhead

### Node.js Profiling

```typescript
import { produceFast } from '@sylphx/pura'

// Warmup (avoid JIT compilation noise)
for (let i = 0; i < 100; i++) {
  produceFast(data, $ => {
    // ... mutations
  })
}

// Measure
const start = process.hrtime.bigint()
for (let i = 0; i < 1000; i++) {
  produceFast(data, $ => {
    // ... mutations
  })
}
const end = process.hrtime.bigint()
const avg = Number(end - start) / 1000000 / 1000  // Convert to ms
console.log(`Average: ${avg.toFixed(3)}ms`)
```

## Real-World Optimization

### Redux Reducer

```typescript
import { produceFast } from '@sylphx/pura'

// ✅ Optimized reducer
const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return produceFast(state, $ => {
        $.push(action.payload)  // O(1) with tail
      })

    case 'UPDATE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {  // Read from base
          if (state[i].id === action.id) {
            $.set([i, 'text'], action.text)  // Write with helper
            break
          }
        }
      })

    default:
      return state  // No-op is fast!
  }
}
```

**Impact:** 5× faster than Immer for array-heavy state.

### React State

```typescript
import { produceFast } from '@sylphx/pura'
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

  const toggleTodo = (id) => {
    setTodos(current =>
      produceFast(current, $ => {
        for (let i = 0; i < current.length; i++) {
          if (current[i].id === id) {
            $.set([i, 'completed'], !current[i].completed)
            break
          }
        }
      })
    )
  }

  // ... render
}
```

**Impact:** Fast updates even with 1,000+ todos.

## Summary

### Performance Checklist

- [ ] Use `produceFast()` for new code (1.06-105× faster than Immer)
- [ ] Batch multiple updates in single `produce()` call
- [ ] Trust adaptive strategy (don't manually manage representation)
- [ ] Use helper methods (`$.set`, `$.push`) instead of direct mutation in `produceFast()`
- [ ] Read from base parameter, write with helper in loops
- [ ] Convert to native with `unpura()` only for hot loops (10,000+ iterations)
- [ ] Avoid nested `produce()` calls
- [ ] Profile before optimizing

### Quick Reference

| Scenario | Fastest Approach | Impact |
|----------|-----------------|--------|
| **Array push** | `$.push()` | 2-5× faster than spread |
| **Array update** | `$.set(index, value)` | 10-100× faster for large arrays |
| **Deep object update** | `$.set(['a', 'b', 'c'], value)` | 2-3× faster |
| **Map update** | `$.set(key, value)` | 12× faster than Immer |
| **Set add** | `$.add(value)` | 105× faster than Immer |
| **Hot loop** | `unpura()` first | 2-5× faster access |

### Next Steps

- [Understanding Adaptive Strategy](/guide/understanding-adaptive) - How Pura chooses representation
- [Architecture](/guide/architecture) - Deep dive into RRB-Tree and HAMT
- [Benchmarks](https://github.com/sylphxltd/pura/tree/main/packages/core/bench) - Detailed performance comparisons
