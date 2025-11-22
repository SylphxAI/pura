# produce() API

Immer-compatible API for direct mutation syntax.

## Overview

`produce()` provides an Immer-compatible API where you mutate a draft object directly:

```typescript
import { produce } from '@sylphx/pura'

const next = produce(state, draft => {
  draft.items[0] = 999        // Direct mutation
  draft.user.name = 'Jane'    // Just like Immer
})
```

**When to use:**
- Migrating from Immer (drop-in replacement)
- Prefer mutation syntax
- Complex nested logic easier with direct access

**Performance:**
- Still faster than Immer (1.06-105x)
- For maximum performance, use [`produceFast()`](/guide/produce-fast-api) instead

## Basic Usage

### Arrays

```typescript
import { produce } from '@sylphx/pura'

const todos = ['Buy milk', 'Walk dog']

// Add item
const added = produce(todos, draft => {
  draft.push('Code review')
})

// Update item
const updated = produce(todos, draft => {
  draft[0] = 'Buy groceries'
})

// Remove item
const removed = produce(todos, draft => {
  draft.splice(1, 1)
})

// Multiple operations
const result = produce(todos, draft => {
  draft.push('New task')
  draft[0] = 'Updated task'
  draft.sort()
})
```

### Objects

```typescript
import { produce } from '@sylphx/pura'

const user = {
  name: 'John',
  age: 30,
  profile: {
    city: 'NYC',
    theme: 'light'
  }
}

// Shallow update
const updated = produce(user, draft => {
  draft.age = 31
})

// Deep update
const deepUpdate = produce(user, draft => {
  draft.profile.theme = 'dark'
  draft.profile.city = 'SF'
})

// Add new property
const withEmail = produce(user, draft => {
  draft.email = 'john@example.com'
})

// Delete property
const withoutAge = produce(user, draft => {
  delete draft.age
})
```

### Maps

```typescript
import { produce } from '@sylphx/pura'

const map = new Map([
  ['a', 1],
  ['b', 2]
])

const updated = produce(map, draft => {
  draft.set('c', 3)     // Add entry
  draft.delete('a')     // Remove entry
  draft.set('b', 999)   // Update entry
})
```

### Sets

```typescript
import { produce } from '@sylphx/pura'

const set = new Set([1, 2, 3])

const updated = produce(set, draft => {
  draft.add(4)       // Add element
  draft.delete(1)    // Remove element
})
```

## Advanced Usage

### Nested Structures

```typescript
import { produce } from '@sylphx/pura'

const state = {
  users: [
    { id: 1, name: 'John', tags: ['admin'] },
    { id: 2, name: 'Jane', tags: ['user'] }
  ],
  settings: {
    theme: 'light',
    notifications: {
      email: true,
      push: false
    }
  }
}

const next = produce(state, draft => {
  // Update nested array element
  draft.users[0].name = 'John Doe'

  // Add to nested array
  draft.users[0].tags.push('moderator')

  // Update deeply nested object
  draft.settings.notifications.push = true

  // Add new user
  draft.users.push({
    id: 3,
    name: 'Bob',
    tags: ['guest']
  })
})
```

### Conditional Updates

```typescript
import { produce } from '@sylphx/pura'

const toggleTodo = (todos, id) => {
  return produce(todos, draft => {
    const todo = draft.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  })
}

const removeFailed = (items) => {
  return produce(items, draft => {
    for (let i = draft.length - 1; i >= 0; i--) {
      if (draft[i].status === 'failed') {
        draft.splice(i, 1)
      }
    }
  })
}
```

### Array Methods

All array methods work as expected:

```typescript
import { produce } from '@sylphx/pura'

const items = [1, 2, 3, 4, 5]

// push, pop, shift, unshift
const result1 = produce(items, draft => {
  draft.push(6)
  draft.unshift(0)
  draft.pop()
  draft.shift()
})

// splice
const result2 = produce(items, draft => {
  draft.splice(2, 1, 99, 100)  // Remove 1, add 2
})

// sort, reverse
const result3 = produce(items, draft => {
  draft.reverse()
  draft.sort((a, b) => b - a)
})

// fill, copyWithin
const result4 = produce(items, draft => {
  draft.fill(0, 2, 4)
})
```

## Type Safety

Perfect TypeScript inference:

```typescript
import { produce } from '@sylphx/pura'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos: Todo[] = [
  { id: 1, text: 'Buy milk', completed: false }
]

const updated = produce(todos, draft => {
  draft[0].completed = true       // ✅ Type-safe
  draft[0].text = 'Buy groceries' // ✅ Type-safe
  draft[0].invalid = 'x'          // ❌ Type error!
  draft[0].completed = 'x'        // ❌ Type error!
})

// updated has type Todo[]
```

## No Wrapper Needed

```typescript
import { produce } from '@sylphx/pura'

// ❌ Don't do this - unnecessary!
const state = pura({ items: [1, 2, 3] })
const next = produce(state, draft => {
  draft.items[0] = 999
})

// ✅ Do this - auto-converts!
const state = { items: [1, 2, 3] }
const next = produce(state, draft => {
  draft.items[0] = 999
})
```

`produce()` automatically handles conversion - no manual wrapping required!

## Return Value Behavior

### Implicit Return

By default, `produce()` returns the modified draft:

```typescript
const next = produce(state, draft => {
  draft.items[0] = 999
  // Implicit return: modified draft
})
```

### Explicit Return (Not Recommended)

You can explicitly return a value, but this bypasses Pura's optimizations:

```typescript
const next = produce(state, draft => {
  return { ...draft, extra: 'value' }
  // Returns new object - no structural sharing!
})
```

**Recommendation**: Let `produce()` handle the return automatically.

## Adaptive Strategy

`produce()` uses Pura's adaptive strategy:

```typescript
// Small array (< 512) → native copy
const small = [1, 2, 3]
const result = produce(small, draft => {
  draft.push(4)
})
// result is a native array

// Large array (>= 512) → persistent tree
const large = Array.from({ length: 1000 }, (_, i) => i)
const result = produce(large, draft => {
  draft[500] = 999
})
// result uses RRB-Tree internally
```

The strategy is automatic - you don't need to think about it!

## Performance Tips

### Use produceFast() for Better Performance

`produceFast()` is **1.06-105x faster** for most operations:

```typescript
// Good - but produceFast() is faster!
const next = produce(state, draft => {
  draft.items[0] = 999
})

// Better - optimized helper API
import { produceFast } from '@sylphx/pura'
const next = produceFast(state, $ => {
  $.set(['items', 0], 999)
})
```

See [produceFast() API](/guide/produce-fast-api) for details.

### Batch Updates

Batch multiple updates in a single `produce()` call:

```typescript
// ❌ Multiple produce() calls (slower)
let state = { a: 1, b: 2, c: 3 }
state = produce(state, draft => { draft.a = 10 })
state = produce(state, draft => { draft.b = 20 })
state = produce(state, draft => { draft.c = 30 })

// ✅ Single produce() call (faster)
const next = produce(state, draft => {
  draft.a = 10
  draft.b = 20
  draft.c = 30
})
```

## Common Patterns

### Redux Reducer

```typescript
import { produce } from '@sylphx/pura'

const todosReducer = (state = [], action) => {
  return produce(state, draft => {
    switch (action.type) {
      case 'ADD_TODO':
        draft.push(action.payload)
        break

      case 'TOGGLE_TODO':
        const todo = draft.find(t => t.id === action.id)
        if (todo) {
          todo.completed = !todo.completed
        }
        break

      case 'DELETE_TODO':
        const index = draft.findIndex(t => t.id === action.id)
        if (index !== -1) {
          draft.splice(index, 1)
        }
        break
    }
  })
}
```

### React Hooks

```typescript
import { useState } from 'react'
import { produce } from '@sylphx/pura'

function useImmer(initialState) {
  const [state, setState] = useState(initialState)

  const updateState = (updater) => {
    setState(current => produce(current, updater))
  }

  return [state, updateState]
}

// Usage
function TodoApp() {
  const [state, updateState] = useImmer({ todos: [] })

  const addTodo = (text) => {
    updateState(draft => {
      draft.todos.push({ text, completed: false })
    })
  }

  return (/* ... */)
}
```

## Comparison with Immer

Pura's `produce()` is **compatible** with Immer but **faster**:

```typescript
// Both work the same way
import { produce } from 'immer'     // Immer
import { produce } from '@sylphx/pura'      // Pura (1.06-105x faster)

const next = produce(state, draft => {
  draft.items[0] = 999
})
```

**Migration**: Just change the import! See [Migration Guide](/guide/migration-from-immer).

## Next Steps

- [produceFast() API](/guide/produce-fast-api) - Optimized API (recommended)
- [Migration from Immer](/guide/migration-from-immer) - Easy migration
- [Examples](/examples/arrays) - Real-world usage
