# unpura()

Convert Pura persistent structures back to native JavaScript.

## Signature

```typescript
function unpura<T>(value: T): T
```

## Overview

`unpura()` extracts the underlying data as native JavaScript structures:

```typescript
import { unpura, produceFast, isPura } from '@sylphx/pura'

const large = Array.from({ length: 1000 }, (_, i) => i)
const result = produceFast(large, $ => $.set(500, 999))

console.log(isPura(result))  // true (RRB-Tree proxy)

const native = unpura(result)
console.log(isPura(native))  // false (native array)
console.log(Array.isArray(native))  // true
```

## When to Use

**In most cases, you don't need `unpura()`:**

Pura proxies behave like native structures:
- Indexing (`arr[0]`)
- Properties (`.length`, `.size`)
- Iteration (`for...of`, `.forEach`)
- Serialization (`JSON.stringify`)

**Use `unpura()` when:**

1. **Third-party libraries** - Some libraries check types internally:
   ```typescript
   const native = unpura(puraArray)
   externalLib.process(native)  // ✅ Works with native
   ```

2. **Performance-critical hot loops** - Native is faster for tight loops:
   ```typescript
   const native = unpura(data)
   for (let i = 0; i < 10000; i++) {
     // Direct access faster than proxy
   }
   ```

3. **Explicit type checks** - When APIs check `instanceof`:
   ```typescript
   const nativeMap = unpura(puraMap)
   nativeMap instanceof Map  // true
   ```

4. **Debugging** - Convert for easier inspection:
   ```typescript
   console.log(unpura(puraData))
   ```

## Deep Conversion

`unpura()` recursively converts nested structures:

```typescript
const nested = produceFast({
  users: [
    { id: 1, tags: new Set([1, 2]) },
    { id: 2, tags: new Set([3, 4]) }
  ],
  metadata: new Map([['version', 1]])
}, $ => {
  // ... mutations
})

const native = unpura(nested)

// All levels converted:
// - Top object: native
// - users array: native
// - tags Sets: native Sets
// - metadata Map: native Map
```

## No-op for Native

Calling `unpura()` on already-native data is safe:

```typescript
const native = [1, 2, 3]
const result = unpura(native)

console.log(result === native)  // true (same reference)
```

## Performance

`unpura()` is **O(n)** where n is total elements:

```typescript
// Small array: ~1μs
const small = unpura(puraSmall)

// Large array: ~100μs
const large = unpura(puraLarge)
```

**Cache if called repeatedly:**

```typescript
// ❌ Don't convert repeatedly
for (let i = 0; i < 1000; i++) {
  const native = unpura(puraData)  // 1000× conversions!
}

// ✅ Convert once, reuse
const native = unpura(puraData)
for (let i = 0; i < 1000; i++) {
  process(native)
}
```

## Type Safety

Preserves types:

```typescript
interface User {
  id: number
  name: string
}

const users: User[] = [{ id: 1, name: 'Alice' }]
const updated = produceFast(users, $ => {
  $.set([0, 'name'], 'Alice Updated')
})

const native: User[] = unpura(updated)
console.log(native[0].name)  // ✅ Type-safe
```

## Complete Documentation

See [unpura() Guide](/guide/unpura) for comprehensive documentation including:
- When to use (and when not to)
- Performance considerations
- Caching patterns
- Hot loop optimization
- Comparison with isPura()

## Related Functions

- [`isPura()`](/api/is-pura) - Check if value is Pura proxy
- [`pura()`](/api/pura) - Wrap value in persistent structure

## Next Steps

- [Understanding Adaptive Strategy](/guide/understanding-adaptive) - When Pura uses native vs trees
- [Performance Guide](/guide/performance) - Optimization tips
