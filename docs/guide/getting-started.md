# Getting Started

Get up and running with Pura in minutes.

## Installation

::: code-group

```bash [npm]
npm install @sylphx/pura
```

```bash [bun]
bun add @sylphx/pura
```

```bash [pnpm]
pnpm add @sylphx/pura
```

:::

## Quick Start

### Choose Your API

Pura offers two APIs - choose based on your needs:

**Option 1: `produceFast()` - Recommended** (1.06-105x faster than Immer)

```typescript
import { produceFast } from '@sylphx/pura'

const state = [1, 2, 3]
const newState = produceFast(state, $ => {
  $.set(0, 999)  // Helper-based API
  $.push(4)
})
```

**Option 2: `produce()` - Immer-Compatible** (for migration)

```typescript
import { produce } from '@sylphx/pura'

const state = { items: [1, 2, 3] }
const newState = produce(state, draft => {
  draft.items[0] = 999  // Direct mutation syntax
})
```

## Basic Examples

### Arrays

```typescript
import { produceFast } from '@sylphx/pura'

const todos = ['Buy milk', 'Walk dog']

// Add item
const added = produceFast(todos, $ => {
  $.push('Code review')
})

// Update item
const updated = produceFast(todos, $ => {
  $.set(0, 'Buy groceries')
})

// Remove item
const removed = produceFast(todos, $ => {
  $.splice(1, 1)  // Remove index 1
})
```

### Objects

```typescript
import { produceFast } from '@sylphx/pura'

const user = {
  name: 'John',
  profile: {
    age: 30,
    city: 'NYC'
  }
}

// Deep update
const updated = produceFast(user, $ => {
  $.set(['profile', 'age'], 31)
  $.set(['profile', 'city'], 'SF')
})
```

### Maps & Sets

```typescript
import { produceFast } from '@sylphx/pura'

// Maps
const map = new Map([['a', 1], ['b', 2]])
const newMap = produceFast(map, $ => {
  $.set('c', 3)
  $.delete('a')
})

// Sets
const set = new Set([1, 2, 3])
const newSet = produceFast(set, $ => {
  $.add(4)
  $.delete(1)
})
```

## Key Concepts

### Returns Native JavaScript Types

**Pura returns real Array/Object/Map/Set** - not custom wrappers:

```typescript
import { produce } from '@sylphx/pura'

const state = [1, 2, 3]
const next = produce(state, draft => {
  draft.push(4)
})

// next is a real Array - use it anywhere!
next[0]              // ✅ works - real Array access
next instanceof Array // ✅ true
await api.send(next)  // ✅ works with any library

// Compare to Immutable.js:
// Must use .get(index), not [index]
// Must convert with .toArray() for interop
```

**Why this matters:**
- ✅ Zero learning curve - standard JavaScript methods
- ✅ 100% library compatible - works everywhere
- ✅ No conversion overhead - no `.toJS()` needed
- ✅ Perfect TypeScript inference

### No Manual Wrapping Needed

```typescript
// ❌ Don't do this
const state = pura([1, 2, 3])
const newState = produce(state, $ => $.push(4))

// ✅ Do this - auto-converts!
const state = [1, 2, 3]
const newState = produce(state, $ => $.push(4))
```

Both `produce()` and `pura()` automatically handle conversion.

### Adaptive Strategy

Pura automatically chooses the best representation:

- **Small (<512)**: Native arrays/maps/sets (zero overhead)
- **Large (>=512)**: Persistent tree structures (structural sharing)

You don't need to think about this - it's automatic!

```typescript
// Small array → uses native copy (fast!)
const small = [1, 2, 3]
const result1 = produceFast(small, $ => $.push(4))
// result1 is a native array

// Large array → uses persistent tree (memory efficient!)
const large = Array.from({ length: 1000 }, (_, i) => i)
const result2 = produceFast(large, $ => $.set(500, 999))
// result2 uses RRB-Tree internally
```

## TypeScript Support

Perfect type inference out of the box:

```typescript
import { produceFast } from '@sylphx/pura'

interface User {
  name: string
  age: number
}

const user: User = { name: 'John', age: 30 }

const updated = produceFast(user, $ => {
  $.set(['age'], 31)  // ✅ Type-safe
  $.set(['invalid'], 'x')  // ❌ Type error!
})

// updated has type User
```

## Next Steps

- [Why Pura?](/guide/why-pura) - Understand the benefits
- [produce() API](/guide/produce-api) - Immer-compatible API
- [produceFast() API](/guide/produce-fast-api) - Optimized API
- [Migration from Immer](/guide/migration-from-immer) - Easy migration

## Common Patterns

### Redux Reducer

```typescript
import { produceFast } from '@sylphx/pura'

const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return produceFast(state, $ => {
        $.push(action.payload)
      })

    case 'TOGGLE_TODO':
      return produceFast(state, $ => {
        const todo = state[action.index]
        $.set([action.index, 'completed'], !todo.completed)
      })

    default:
      return state
  }
}
```

### React State

```typescript
import { useState } from 'react'
import { produceFast } from '@sylphx/pura'

function TodoApp() {
  const [todos, setTodos] = useState([])

  const addTodo = (text) => {
    setTodos(current =>
      produceFast(current, $ => {
        $.push({ text, completed: false })
      })
    )
  }

  const toggleTodo = (index) => {
    setTodos(current =>
      produceFast(current, $ => {
        const todo = current[index]
        $.set([index, 'completed'], !todo.completed)
      })
    )
  }

  return (/* ... */)
}
```

### Zustand Store

```typescript
import { create } from 'zustand'
import { produceFast } from '@sylphx/pura'

const useStore = create((set) => ({
  todos: [],

  addTodo: (text) => set((state) => ({
    todos: produceFast(state.todos, $ => {
      $.push({ text, completed: false })
    })
  })),

  toggleTodo: (index) => set((state) => ({
    todos: produceFast(state.todos, $ => {
      const todo = state.todos[index]
      $.set([index, 'completed'], !todo.completed)
    })
  }))
}))
```
