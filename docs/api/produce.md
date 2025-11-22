# produce()

Immer-compatible API for direct mutation syntax.

## Signature

```typescript
function produce<T>(base: T, recipe: (draft: T) => void): T
```

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
- Prefer mutation syntax over helper methods
- Complex nested logic easier with direct access

**Performance:** 1.06-105× faster than Immer

For maximum performance, use [`produceFast()`](/api/produce-fast) instead (helper-based API).

## Complete Documentation

See [produce() API Guide](/guide/produce-api) for comprehensive documentation including:
- Arrays (push, pop, splice, etc.)
- Objects (shallow, deep, add/delete properties)
- Maps and Sets
- Advanced patterns
- Type safety
- Performance tips
- Common patterns (Redux, React, Zustand)
