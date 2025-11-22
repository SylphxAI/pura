# produceFast() API

**Recommended API** for maximum performance (1.06-105x faster than Immer).

## Overview

`produceFast()` uses a helper-based mutation API for optimal performance:

```typescript
import { produceFast } from 'pura'

const next = produceFast(state, $ => {
  $.set(['items', 0], 999)    // Helper-based mutation
  $.push(4)                    // Array methods
})
```

**Why use produceFast()?**
- **Faster**: 1.06-105x faster than Immer, faster than `produce()`
- **Explicit**: Clear, intentional updates
- **Optimized**: Avoids proxy overhead
- **Type-safe**: Perfect TypeScript inference

## Array Helper API

### Basic Operations

```typescript
import { produceFast } from 'pura'

const items = [1, 2, 3, 4, 5]

// Update element
const updated = produceFast(items, $ => {
  $.set(0, 999)  // Set index 0 to 999
})

// Push (add to end)
const added = produceFast(items, $ => {
  $.push(6, 7, 8)  // Add multiple
})

// Pop (remove from end)
const popped = produceFast(items, $ => {
  const last = $.pop()  // Returns popped value
})
```

### Array Methods

All standard array methods are available:

```typescript
import { produceFast } from 'pura'

const items = [1, 2, 3, 4, 5]

// splice
const spliced = produceFast(items, $ => {
  $.splice(2, 1, 99, 100)  // Remove 1 at index 2, add 2
})

// unshift (add to start)
const prepended = produceFast(items, $ => {
  $.unshift(0)
})

// shift (remove from start)
const shifted = produceFast(items, $ => {
  const first = $.shift()
})

// reverse
const reversed = produceFast(items, $ => {
  $.reverse()
})

// sort
const sorted = produceFast(items, $ => {
  $.sort((a, b) => b - a)  // Descending
})

// fill
const filled = produceFast(items, $ => {
  $.fill(0, 2, 4)  // Fill with 0 from index 2 to 4
})

// copyWithin
const copied = produceFast(items, $ => {
  $.copyWithin(0, 3, 5)
})
```

### Filter & Map

```typescript
import { produceFast } from 'pura'

const items = [1, 2, 3, 4, 5]

// Filter (creates new array)
const filtered = produceFast(items, $ => {
  return $.filter(x => x > 2)  // Must return!
})

// Map (creates new array)
const mapped = produceFast(items, $ => {
  return $.map(x => x * 2)  // Must return!
})
```

**Note**: `filter()` and `map()` create new arrays, so they must be returned explicitly.

## Object Helper API

### Path-based Updates

```typescript
import { produceFast } from 'pura'

const user = {
  name: 'John',
  profile: {
    age: 30,
    settings: {
      theme: 'light'
    }
  }
}

// Deep update
const updated = produceFast(user, $ => {
  $.set(['profile', 'age'], 31)
  $.set(['profile', 'settings', 'theme'], 'dark')
})

// Shallow update
const shallow = produceFast(user, $ => {
  $.set(['name'], 'Jane')
})
```

### Add/Delete Properties

```typescript
import { produceFast } from 'pura'

const user = { name: 'John', age: 30 }

// Add property
const withEmail = produceFast(user, $ => {
  $.set(['email'], 'john@example.com')
})

// Delete property
const withoutAge = produceFast(user, $ => {
  $.delete(['age'])
})
```

## Map Helper API

```typescript
import { produceFast } from 'pura'

const map = new Map([
  ['a', 1],
  ['b', 2]
])

const updated = produceFast(map, $ => {
  $.set('c', 3)       // Add entry
  $.delete('a')       // Remove entry
  $.clear()           // Clear all entries

  // Check existence
  if ($.has('b')) {
    $.set('b', 999)   // Update entry
  }
})
```

## Set Helper API

```typescript
import { produceFast } from 'pura'

const set = new Set([1, 2, 3])

const updated = produceFast(set, $ => {
  $.add(4)           // Add element
  $.add(5)
  $.delete(1)        // Remove element
  $.clear()          // Clear all elements

  // Check existence
  if ($.has(2)) {
    $.delete(2)
  }
})
```

## Advanced Patterns

### Conditional Updates

```typescript
import { produceFast } from 'pura'

const toggleTodo = (todos, id) => {
  return produceFast(todos, $ => {
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        $.set([i, 'completed'], !todos[i].completed)
        break
      }
    }
  })
}
```

### Batch Updates

```typescript
import { produceFast } from 'pura'

const batchUpdate = (items, updates) => {
  return produceFast(items, $ => {
    for (const [index, value] of updates) {
      $.set(index, value)
    }
  })
}

// Usage
const next = batchUpdate(items, [
  [0, 999],
  [2, 888],
  [4, 777]
])
```

### Nested Structures

```typescript
import { produceFast } from 'pura'

const state = {
  users: [
    { id: 1, name: 'John', tags: ['admin'] },
    { id: 2, name: 'Jane', tags: ['user'] }
  ]
}

const next = produceFast(state, $ => {
  // Update nested array element
  $.set(['users', 0, 'name'], 'John Doe')

  // Add to nested array
  const currentTags = state.users[0].tags
  $.set(['users', 0, 'tags'], [...currentTags, 'moderator'])

  // Add new user
  $.set(['users', state.users.length], {
    id: 3,
    name: 'Bob',
    tags: ['guest']
  })
})
```

## Type Safety

Perfect TypeScript inference:

```typescript
import { produceFast } from 'pura'

interface User {
  name: string
  age: number
  profile: {
    city: string
  }
}

const user: User = {
  name: 'John',
  age: 30,
  profile: { city: 'NYC' }
}

const next = produceFast(user, $ => {
  $.set(['age'], 31)                    // ✅ Type-safe
  $.set(['profile', 'city'], 'SF')      // ✅ Type-safe
  $.set(['invalid'], 'x')               // ❌ Type error!
  $.set(['age'], 'x')                   // ❌ Type error!
})

// next has type User
```

## No Wrapper Needed

```typescript
import { produceFast } from 'pura'

// ❌ Don't do this - unnecessary!
const state = pura([1, 2, 3])
const next = produceFast(state, $ => $.push(4))

// ✅ Do this - auto-converts!
const state = [1, 2, 3]
const next = produceFast(state, $ => $.push(4))
```

`produceFast()` automatically handles conversion!

## Performance Tips

### Use Helper Methods

```typescript
// ✅ Good - uses optimized path
produceFast(state, $ => {
  $.set(0, 999)
})

// ❌ Avoid - direct mutation not optimized
produceFast(state, $ => {
  state[0] = 999  // Don't do this in produceFast!
})
```

### Batch Multiple Updates

```typescript
// ❌ Multiple calls (slower)
let state = [1, 2, 3]
state = produceFast(state, $ => $.set(0, 10))
state = produceFast(state, $ => $.set(1, 20))
state = produceFast(state, $ => $.set(2, 30))

// ✅ Single call (faster)
const next = produceFast(state, $ => {
  $.set(0, 10)
  $.set(1, 20)
  $.set(2, 30)
})
```

### Read from Base, Write with Helper

```typescript
produceFast(todos, $ => {
  // ✅ Read from base (passed parameter)
  for (let i = 0; i < todos.length; i++) {
    if (todos[i].completed) {
      // ✅ Write using helper
      $.delete(i)
    }
  }
})
```

## Common Patterns

### Redux Reducer

```typescript
import { produceFast } from 'pura'

const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return produceFast(state, $ => {
        $.push(action.payload)
      })

    case 'UPDATE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.id) {
            $.set([i, 'text'], action.text)
            break
          }
        }
      })

    case 'DELETE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.id) {
            $.splice(i, 1)
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
import { useState } from 'react'
import { produceFast } from 'pura'

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
    items: produceFast(state.items, $ => {
      $.push(item)
    })
  })),

  updateItem: (id, updates) => set((state) => ({
    items: produceFast(state.items, $ => {
      for (let i = 0; i < state.items.length; i++) {
        if (state.items[i].id === id) {
          for (const [key, value] of Object.entries(updates)) {
            $.set([i, key], value)
          }
          break
        }
      }
    })
  }))
}))
```

## Comparison with produce()

Both APIs work with the same data, but `produceFast()` is optimized:

```typescript
// produce() - Immer-compatible
import { produce } from 'pura'
const next = produce(state, draft => {
  draft[0] = 999  // Direct mutation
})

// produceFast() - Optimized (1.06-105x faster)
import { produceFast } from 'pura'
const next = produceFast(state, $ => {
  $.set(0, 999)  // Helper-based
})
```

**When to use each:**
- `produceFast()`: New code, maximum performance
- `produce()`: Migrating from Immer, prefer mutation syntax

## Next Steps

- [produce() API](/guide/produce-api) - Immer-compatible alternative
- [Examples](/examples/arrays) - Real-world usage
- [Performance Tips](/guide/performance) - Optimization guide
