# produceFast()

Optimized helper-based API for maximum performance (1.06-105× faster than Immer).

## Signature

```typescript
function produceFast<T>(base: T, recipe: (helper: FastHelper<T>) => void): T
```

## Overview

`produceFast()` uses a helper-based mutation API for optimal performance:

```typescript
import { produceFast } from 'pura'

const next = produceFast(state, $ => {
  $.set(['items', 0], 999)    // Helper-based mutation
  $.push(4)                    // Array methods
  $.set(['user', 'name'], 'Jane')
})
```

**Why use produceFast()?**
- **Faster:** 1.06-105× faster than Immer, faster than `produce()`
- **Explicit:** Clear, intentional updates
- **Optimized:** Avoids proxy overhead
- **Type-safe:** Perfect TypeScript inference

## Helper APIs

### ArrayHelper

```typescript
$.set(index, value)           // Update element
$.delete(index)               // Remove element
$.push(...items)              // Add to end
$.pop()                       // Remove from end
$.unshift(...items)           // Add to start
$.shift()                     // Remove from start
$.splice(start, count, ...items)
$.reverse()
$.sort(compareFn)
$.fill(value, start, end)
$.filter(fn)                  // Must return!
$.map(fn)                     // Must return!
```

### ObjectHelper

```typescript
$.set(['path', 'to', 'prop'], value)    // Deep update
$.update(['path'], updater)              // Update with function
$.delete(['path'])                       // Delete property
$.merge(['path'], partial)               // Merge object
```

### MapHelper

```typescript
$.set(key, value)
$.delete(key)
$.clear()
$.has(key)
```

### SetHelper

```typescript
$.add(value)
$.delete(value)
$.clear()
$.has(value)
```

## Complete Documentation

See [produceFast() API Guide](/guide/produce-fast-api) for comprehensive documentation including:
- All helper methods
- Nested structures
- Type safety examples
- Performance tips
- Common patterns (Redux, React, Zustand)
- Comparison with produce()
