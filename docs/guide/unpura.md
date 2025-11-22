# unpura() - Converting to Native

Convert Pura persistent structures back to native JavaScript.

## Overview

```typescript
import { unpura, produceFast, isPura } from 'pura'

const large = Array.from({ length: 1000 }, (_, i) => i)
const result = produceFast(large, $ => $.set(500, 999))

console.log(isPura(result))  // true (RRB-Tree proxy)

const native = unpura(result)
console.log(isPura(native))  // false (native array)
console.log(Array.isArray(native))  // true
```

**unpura()** extracts the underlying data as native JavaScript structures.

## Why unpura()?

### Pura is Transparent

In most cases, **you don't need `unpura()`**:

```typescript
const result = produceFast([1, 2, 3], $ => $.push(4))

// Works directly - no unpura() needed!
console.log(result[0])  // 1
console.log(result.length)  // 4
result.forEach(x => console.log(x))  // Works!
JSON.stringify(result)  // Works!
```

Pura proxies **behave like native structures** - they support:
- Indexing (`arr[0]`)
- Properties (`.length`, `.size`)
- Iteration (`for...of`, `.forEach`, `.map`)
- Serialization (`JSON.stringify`)

### When You Need unpura()

**1. Third-Party Libraries**

Some libraries use internal checks that fail on proxies:

```typescript
import { unpura } from 'pura'
import externalLib from 'some-library'

const puraArray = produceFast(data, $ => {
  // ... mutations
})

// Library might not recognize proxy
// externalLib.process(puraArray)  // Might fail!

// Convert to native first
const native = unpura(puraArray)
externalLib.process(native)  // ✅ Works!
```

**2. Performance-Critical Hot Loops**

Native arrays are faster for tight loops (rare):

```typescript
import { unpura, produceFast } from 'pura'

const data = produceFast(largeArray, $ => {
  // ... build data structure
})

// Convert once before hot loop
const native = unpura(data)

// Hot loop on native (faster access)
for (let i = 0; i < native.length; i++) {
  // ... intensive computation
}
```

**3. Debugging and Inspection**

Convert to native for easier debugging:

```typescript
const puraData = produceFast(data, $ => {
  // ... complex mutations
})

// Inspect as native structure
console.log(unpura(puraData))
```

**4. Explicit Type Requirements**

When APIs explicitly check for native types:

```typescript
import { unpura } from 'pura'

const puraMap = produceFast(new Map(), $ => {
  $.set('a', 1)
})

// Some APIs check: obj instanceof Map
// puraMap instanceof Map  // false (proxy)

const nativeMap = unpura(puraMap)
nativeMap instanceof Map  // true ✅
```

## API

### Basic Usage

```typescript
import { unpura } from 'pura'

// Arrays
const puraArray = produceFast([1, 2, 3], $ => $.push(4))
const nativeArray = unpura(puraArray)  // [1, 2, 3, 4]

// Objects
const puraObj = produceFast({ a: 1 }, $ => $.set(['b'], 2))
const nativeObj = unpura(puraObj)  // { a: 1, b: 2 }

// Maps
const puraMap = produceFast(new Map(), $ => $.set('a', 1))
const nativeMap = unpura(puraMap)  // Map { 'a' => 1 }

// Sets
const puraSet = produceFast(new Set(), $ => $.add(1))
const nativeSet = unpura(puraSet)  // Set { 1 }
```

### Deep Conversion

`unpura()` **recursively** converts nested structures:

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

// All levels converted to native:
// - Top-level object: native
// - users array: native
// - Each user object: native
// - Each tags Set: native Set
// - metadata Map: native Map
```

### No-op for Native

Calling `unpura()` on **already-native** data is a **no-op**:

```typescript
const native = [1, 2, 3]
const result = unpura(native)

console.log(result === native)  // true (same reference)
```

**Safe to call** even if you're unsure whether data is Pura or native!

### Shallow vs Deep

`unpura()` always does **deep conversion**:

```typescript
const data = {
  shallow: 'value',
  nested: {
    deep: {
      value: 'here'
    }
  }
}

const pura = produceFast(data, $ => $.set(['nested', 'deep', 'value'], 'updated'))
const native = unpura(pura)

// All levels are native objects
console.log(isPura(native))  // false
console.log(isPura(native.nested))  // false
console.log(isPura(native.nested.deep))  // false
```

**No partial conversions** - entire tree is converted to native.

## Performance

### Conversion Cost

`unpura()` is **O(n)** where n is the total number of elements:

```typescript
// Small array: ~1μs
const small = produceFast(Array(100).fill(0), $ => $.set(50, 999))
unpura(small)  // Fast

// Large array: ~100μs
const large = produceFast(Array(10000).fill(0), $ => $.set(5000, 999))
unpura(large)  // Slower (but still fast)
```

**When to care:**
- Hot paths called millions of times → avoid repeated `unpura()`
- One-time conversion → cost is negligible

### Caching Pattern

If you need native version repeatedly, **cache it**:

```typescript
// ❌ Don't convert repeatedly
function process(puraData) {
  const native = unpura(puraData)  // O(n) every call!
  // ... use native
}
for (let i = 0; i < 1000; i++) {
  process(puraData)  // 1000× conversions!
}

// ✅ Convert once, reuse
const native = unpura(puraData)  // O(n) once
for (let i = 0; i < 1000; i++) {
  process(native)  // Reuse!
}
```

### Benchmark: Access Patterns

```typescript
const puraArray = produceFast(Array(10000).fill(0), $ => $.set(5000, 999))
const nativeArray = unpura(puraArray)

// Random access: similar performance
console.time('pura-access')
for (let i = 0; i < 10000; i++) {
  const x = puraArray[i]  // ~20μs total
}
console.timeEnd('pura-access')

console.time('native-access')
for (let i = 0; i < 10000; i++) {
  const x = nativeArray[i]  // ~15μs total
}
console.timeEnd('native-access')

// Tight loop: native is faster
console.time('pura-loop')
let sum1 = 0
for (let i = 0; i < 10000; i++) {
  sum1 += puraArray[i]  // ~50μs (proxy overhead)
}
console.timeEnd('pura-loop')

console.time('native-loop')
let sum2 = 0
for (let i = 0; i < 10000; i++) {
  sum2 += nativeArray[i]  // ~10μs (direct access)
}
console.timeEnd('native-loop')
```

**Guideline:** Convert to native for tight loops with 10,000+ iterations.

## Patterns

### Build with Pura, Use as Native

Common pattern: build immutable structure with Pura, then use as native:

```typescript
import { produceFast, unpura } from 'pura'

function buildDataStructure(input) {
  // Build with structural sharing
  const result = produceFast([], $ => {
    for (const item of input) {
      if (item.valid) {
        $.push(transform(item))
      }
    }
  })

  // Return as native for downstream consumers
  return unpura(result)
}

// Downstream code works with native arrays
const data = buildDataStructure(rawInput)
thirdPartyLib.process(data)  // ✅ Native array
```

### Conditional Conversion

Only convert when necessary:

```typescript
import { unpura, isPura } from 'pura'

function ensureNative<T>(data: T): T {
  return isPura(data) ? unpura(data) : data
}

// Usage
const result = ensureNative(maybeNativeOrPura)
externalLib.process(result)  // Always native
```

### Serialize with unpura()

Ensure JSON serialization uses native structures:

```typescript
import { unpura, produceFast } from 'pura'

const state = produceFast(initialState, $ => {
  // ... mutations
})

// Convert before serialization (optional - JSON.stringify works on proxies too!)
const json = JSON.stringify(unpura(state))

// Or just stringify directly (works fine):
const json = JSON.stringify(state)  // Pura proxies are serializable
```

**Note:** `unpura()` before `JSON.stringify` is **optional** - Pura proxies serialize correctly!

### Hot Loop Optimization

```typescript
import { produceFast, unpura } from 'pura'

function processLargeDataset(data) {
  // Build result with Pura (structural sharing)
  const processed = produceFast(data, $ => {
    for (let i = 0; i < data.length; i++) {
      if (shouldProcess(data[i])) {
        $.set(i, expensiveTransform(data[i]))
      }
    }
  })

  // Convert to native for tight loop
  const native = unpura(processed)

  // Intensive computation on native (faster access)
  let sum = 0
  for (let i = 0; i < native.length; i++) {
    sum += computeIntensive(native[i])
  }

  return { processed: native, sum }
}
```

## Type Safety

`unpura()` preserves types:

```typescript
import { unpura, produceFast } from 'pura'

interface User {
  id: number
  name: string
  tags: Set<string>
}

const users: User[] = [
  { id: 1, name: 'Alice', tags: new Set(['admin']) },
  { id: 2, name: 'Bob', tags: new Set(['user']) }
]

const updated = produceFast(users, $ => {
  $.set([0, 'name'], 'Alice Updated')
})

// unpura() preserves type
const native: User[] = unpura(updated)

// TypeScript knows structure
console.log(native[0].name)  // ✅ Type-safe
console.log(native[0].tags instanceof Set)  // true
```

## Comparison: isPura() vs unpura()

### isPura() - Check if Pura

```typescript
import { isPura } from 'pura'

console.log(isPura([1, 2, 3]))  // false (native)
console.log(isPura(produceFast([1, 2, 3], $ => $.push(4))))  // depends on size
```

**Use when:** You need to branch logic based on representation.

### unpura() - Convert to Native

```typescript
import { unpura } from 'pura'

const data = maybeNativeOrPura
const native = unpura(data)  // Always native
```

**Use when:** You need guaranteed native structure.

### Combined Pattern

```typescript
import { isPura, unpura } from 'pura'

function ensureNativeIfNeeded<T>(data: T, forceNative: boolean): T {
  if (forceNative && isPura(data)) {
    return unpura(data)
  }
  return data
}
```

## When NOT to Use unpura()

### ❌ Before Every Operation

```typescript
// Don't do this!
const data = produceFast([1, 2, 3], $ => $.push(4))
const native = unpura(data)  // Unnecessary!
console.log(native.length)  // Could use data.length directly
```

**Why:** Pura proxies support all native operations!

### ❌ For Serialization (Usually)

```typescript
// Don't do this (unnecessary)!
const json = JSON.stringify(unpura(puraData))

// This works fine:
const json = JSON.stringify(puraData)  // Pura handles serialization
```

**Why:** Pura proxies are JSON-serializable by default.

### ❌ Before Read-Only Operations

```typescript
// Don't do this!
const native = unpura(puraArray)
const mapped = native.map(x => x * 2)  // Unnecessary conversion

// This works fine:
const mapped = puraArray.map(x => x * 2)  // Pura supports .map()
```

**Why:** Read-only methods work on Pura proxies without conversion.

## Summary

### Key Takeaways

1. **Rarely needed:** Pura proxies behave like native structures
2. **Use when:** Third-party libraries, hot loops, explicit type checks
3. **Deep conversion:** Recursively converts entire structure
4. **Type-safe:** Preserves TypeScript types
5. **Performance:** O(n) cost - cache if called repeatedly

### Decision Tree

```
Do I need unpura()?
  ├─ Passing to third-party lib? → YES (if it fails with proxy)
  ├─ Tight loop (10,000+ iterations)? → YES (for performance)
  ├─ Explicit type check (instanceof)? → YES (if required)
  ├─ Debugging/inspection? → MAYBE (for readability)
  └─ Normal usage? → NO (Pura proxies work fine!)
```

### Next Steps

- [Understanding Adaptive Strategy](/guide/understanding-adaptive) - When Pura uses native vs trees
- [Performance Guide](/guide/performance) - Optimization tips
- [API Reference: unpura()](/api/unpura) - Complete API documentation
