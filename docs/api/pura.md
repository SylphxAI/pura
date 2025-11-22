# pura()

Wrap value in persistent structure (rarely needed - `produce()`/`produceFast()` auto-convert).

## Signature

```typescript
function pura<T>(value: T): T
```

## Overview

`pura()` explicitly wraps a value in a persistent data structure:

```typescript
import { pura } from 'pura'

// Wrap array in RRB-Tree
const puraArray = pura([1, 2, 3])

// Wrap object in nested proxy
const puraObj = pura({ a: 1, b: 2 })

// Wrap Map in HAMT
const puraMap = pura(new Map([['a', 1]]))

// Wrap Set in HAMT
const puraSet = pura(new Set([1, 2, 3]))
```

## When to Use

**In most cases, you don't need `pura()`:**

```typescript
// ❌ Don't do this
const wrapped = pura([1, 2, 3])
const next = produceFast(wrapped, $ => $.push(4))

// ✅ Do this instead
const next = produceFast([1, 2, 3], $ => $.push(4))
// produceFast/produce automatically wrap as needed!
```

**Rare use cases:**
- Pre-wrapping for reuse (optimization)
- Manual control over representation (advanced)
- Testing/debugging

## Adaptive Strategy

`pura()` follows Pura's adaptive strategy:

**Small collections (<512) → Native JavaScript**

```typescript
const small = pura([1, 2, 3])
// Returns native array (no tree overhead!)

console.log(Array.isArray(small))  // true
console.log(isPura(small))  // false
```

**Large collections (>=512) → Persistent tree**

```typescript
const large = pura(Array.from({ length: 1000 }, (_, i) => i))
// Returns RRB-Tree proxy

console.log(Array.isArray(large))  // false (proxy)
console.log(isPura(large))  // true
```

See [Understanding Adaptive Strategy](/guide/understanding-adaptive) for details.

## Type Safety

Preserves types:

```typescript
interface User {
  name: string
  age: number
}

const user: User = { name: 'John', age: 30 }
const puraUser = pura(user)

// puraUser has type User
console.log(puraUser.name)  // ✅ Type-safe
```

## Examples

### Manual Wrapping (Rarely Needed)

```typescript
import { pura, produceFast } from 'pura'

// Explicitly wrap (usually unnecessary)
const data = pura([1, 2, 3])
const next = produceFast(data, $ => $.push(4))
```

### Pre-wrapping for Reuse (Advanced)

```typescript
import { pura } from 'pura'

// Pre-wrap large dataset
const largeData = pura(Array.from({ length: 10000 }, (_, i) => i))

// Reuse in multiple updates (already wrapped)
const update1 = produceFast(largeData, $ => $.set(0, 999))
const update2 = produceFast(update1, $ => $.set(1, 888))
```

**Note:** This is an advanced optimization. `produceFast()` handles wrapping automatically!

## Related Functions

- [`unpura()`](/api/unpura) - Convert back to native JavaScript
- [`isPura()`](/api/is-pura) - Check if value is Pura proxy

## Next Steps

- [produceFast() API](/api/produce-fast) - Recommended API (auto-wraps)
- [produce() API](/api/produce) - Immer-compatible API (auto-wraps)
- [Understanding Adaptive Strategy](/guide/understanding-adaptive) - How Pura chooses representation
