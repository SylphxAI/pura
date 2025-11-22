# Migration from Immer

Migrate from Immer to Pura in minutes and get **1.06-105x** performance boost.

## Quick Migration

### Step 1: Install Pura

```bash
npm install @sylphx/pura
# or
bun add @sylphx/pura
```

### Step 2: Change Imports

```typescript
// Before (Immer)
import { produce } from 'immer'

// After (Pura) - same code, 1.06-105x faster!
import { produce } from '@sylphx/pura'
```

**That's it!** Your existing code works unchanged.

## Example Migration

### Before (Immer)

```typescript
import { produce } from 'immer'

const baseState = {
  users: [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 }
  ],
  settings: {
    theme: 'light'
  }
}

const nextState = produce(baseState, draft => {
  draft.users[0].age = 31
  draft.settings.theme = 'dark'
  draft.users.push({ id: 3, name: 'Bob', age: 35 })
})
```

### After (Pura)

```typescript
import { produce } from '@sylphx/pura'  // ← Only this line changes!

const baseState = {
  users: [
    { id: 1, name: 'John', age: 30 },
    { id: 2, name: 'Jane', age: 25 }
  ],
  settings: {
    theme: 'light'
  }
}

// Exact same code - works perfectly!
const nextState = produce(baseState, draft => {
  draft.users[0].age = 31
  draft.settings.theme = 'dark'
  draft.users.push({ id: 3, name: 'Bob', age: 35 })
})
```

**Performance gain**: 1.66-3.93x faster for objects, 1.06-5.32x faster for arrays!

## Advanced: Upgrade to produceFast()

For **maximum performance** (1.06-105x faster than Immer), migrate to `produceFast()`:

### Before (Immer)

```typescript
import { produce } from 'immer'

const nextState = produce(state, draft => {
  draft.items[0] = 999
  draft.user.name = 'Jane'
})
```

### After (Pura with produceFast)

```typescript
import { produceFast } from '@sylphx/pura'

const nextState = produceFast(state, $ => {
  $.set(['items', 0], 999)
  $.set(['user', 'name'], 'Jane')
})
```

**Benefits:**
- Even faster (helper-based API avoids proxy overhead)
- More explicit (clear intent)
- Better for new code

## Common Patterns

### Redux Reducers

**Before (Immer)**

```typescript
import { produce } from 'immer'

const todosReducer = (state = [], action) => {
  return produce(state, draft => {
    switch (action.type) {
      case 'ADD_TODO':
        draft.push(action.payload)
        break
      case 'TOGGLE_TODO':
        const todo = draft.find(t => t.id === action.id)
        if (todo) todo.completed = !todo.completed
        break
    }
  })
}
```

**After (Pura) - Same Code!**

```typescript
import { produce } from '@sylphx/pura'  // ← Only change

const todosReducer = (state = [], action) => {
  return produce(state, draft => {
    switch (action.type) {
      case 'ADD_TODO':
        draft.push(action.payload)
        break
      case 'TOGGLE_TODO':
        const todo = draft.find(t => t.id === action.id)
        if (todo) todo.completed = !todo.completed
        break
    }
  })
}
```

**Or upgrade to produceFast():**

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
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.id) {
            $.set([i, 'completed'], !state[i].completed)
            break
          }
        }
      })

    default:
      return state
  }
}
```

### React Hooks (use-immer)

**Before (use-immer)**

```typescript
import { useImmer } from 'use-immer'

function TodoApp() {
  const [todos, updateTodos] = useImmer([])

  const addTodo = (text) => {
    updateTodos(draft => {
      draft.push({ text, completed: false })
    })
  }

  return (/* ... */)
}
```

**After (Pura with produce)**

```typescript
import { useState } from 'react'
import { produce } from '@sylphx/pura'

function TodoApp() {
  const [todos, setTodos] = useState([])

  const addTodo = (text) => {
    setTodos(current =>
      produce(current, draft => {
        draft.push({ text, completed: false })
      })
    )
  }

  return (/* ... */)
}
```

**Or create custom hook:**

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

// Usage - exactly like use-immer!
function TodoApp() {
  const [todos, updateTodos] = useImmer([])

  const addTodo = (text) => {
    updateTodos(draft => {
      draft.push({ text, completed: false })
    })
  }

  return (/* ... */)
}
```

## API Compatibility

### Supported Features

✅ All Immer `produce()` features are supported:

- Direct mutation syntax
- Nested object/array updates
- Array methods (push, pop, splice, etc.)
- Map and Set operations
- Curried producers (advanced)

### Differences

**1. Return Values**

Immer allows returning replacement values. Pura does too, but it's not optimized:

```typescript
// Works but not recommended in Pura
const next = produce(state, draft => {
  return { ...draft, extra: 'value' }
  // Bypasses Pura's structural sharing!
})

// Recommended in Pura
const next = produce(state, draft => {
  draft.extra = 'value'
  // Uses structural sharing
})
```

**2. Auto-freeze**

Immer auto-freezes in development. Pura doesn't (for performance), but you can freeze manually:

```typescript
import { produce } from '@sylphx/pura'

const next = produce(state, draft => {
  draft.items[0] = 999
})

// Manually freeze in development
if (process.env.NODE_ENV === 'development') {
  Object.freeze(next)
}
```

**3. Patches (Not Supported)**

Immer's patch feature is not currently supported in Pura:

```typescript
// Immer only
import { produceWithPatches } from 'immer'
const [next, patches, inversePatches] = produceWithPatches(state, draft => {
  draft.items[0] = 999
})
```

If you need patches, continue using Immer for those specific cases.

## Performance Comparison

### Benchmark Results

| Scenario | Immer | Pura | Speedup |
|----------|-------|------|---------|
| **Sets (1K)** | 2.31K ops/s | **243K ops/s** | **105x faster** 🚀 |
| **Maps (1K)** | 2.08K ops/s | **25.1K ops/s** | **12x faster** 🚀 |
| **Objects (Deep)** | 681K ops/s | **1.70M ops/s** | **2.5x faster** ✅ |
| **Arrays (100)** | 0.87M ops/s | **4.63M ops/s** | **5.3x faster** ✅ |

### Why Faster?

- **Persistent structures**: Arrays/Maps/Sets use HAMT/RRB-Trees (Immer only optimizes objects)
- **Adaptive strategy**: Small collections use native (zero overhead)
- **Optimized algorithms**: Faster structural sharing implementation

## Migration Strategy

### Option 1: Direct Replacement (Easiest)

Just change imports - code works unchanged:

```bash
# Find and replace in your codebase
# Before: import { produce } from 'immer'
# After:  import { produce } from '@sylphx/pura'
```

**Pros:**
- Instant migration
- No code changes needed
- Immediate performance boost

**Cons:**
- Not using optimized `produceFast()` API

### Option 2: Gradual Migration (Recommended)

1. **Phase 1**: Replace imports (instant)
   ```typescript
   import { produce } from '@sylphx/pura'
   ```

2. **Phase 2**: Upgrade hot paths to `produceFast()`
   ```typescript
   // High-traffic reducers
   import { produceFast } from '@sylphx/pura'
   ```

3. **Phase 3**: Migrate remaining code gradually

**Pros:**
- Lowest risk
- Gradual learning curve
- Maximum performance gains

### Option 3: New Code Only

Keep Immer for existing code, use Pura for new code:

```typescript
// Existing code - keep Immer
import { produce } from 'immer'

// New code - use Pura
import { produceFast } from '@sylphx/pura'
```

**Pros:**
- Zero risk to existing code
- Learn Pura incrementally

**Cons:**
- Mixed dependencies

## Troubleshooting

### Type Errors After Migration

If you see TypeScript errors after migration:

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npx tsc --build --clean

# Reinstall dependencies
npm install
```

### Bundle Size Increased

Both Immer and Pura in bundle? Remove Immer:

```bash
npm uninstall immer use-immer
```

### Performance Worse?

Ensure you're using the right API:

```typescript
// ❌ Slower - using Immer's approach
import { produce } from '@sylphx/pura'
const next = produce(state, draft => {
  draft.items = [...draft.items, newItem]  // Full copy!
})

// ✅ Faster - using Pura's approach
import { produce } from '@sylphx/pura'
const next = produce(state, draft => {
  draft.items.push(newItem)  // Optimized!
})

// ✅ Fastest - using produceFast
import { produceFast } from '@sylphx/pura'
const next = produceFast(state, $ => {
  $.push(['items'], newItem)
})
```

## Testing

Your existing Immer tests should pass without changes:

```typescript
import { produce } from '@sylphx/pura'  // ← Changed from 'immer'

describe('todos reducer', () => {
  it('should add todo', () => {
    const state = []
    const next = produce(state, draft => {
      draft.push({ text: 'Buy milk', completed: false })
    })

    expect(next).toEqual([{ text: 'Buy milk', completed: false }])
    expect(state).toEqual([])  // Original unchanged
  })
})
```

## Next Steps

- [produceFast() API](/guide/produce-fast-api) - Learn optimized API
- [Performance Tips](/guide/performance) - Maximize performance
- [Examples](/examples/arrays) - Real-world patterns
