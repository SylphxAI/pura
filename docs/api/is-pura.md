# isPura()

Check if a value is a Pura persistent structure.

## Signature

```typescript
function isPura<T>(value: T): boolean
```

## Overview

`isPura()` returns `true` if the value is a Pura proxy (persistent structure), `false` otherwise:

```typescript
import { isPura, produceFast } from 'pura'

// Native
console.log(isPura([1, 2, 3]))  // false
console.log(isPura({ a: 1 }))  // false
console.log(isPura(new Map()))  // false

// Pura (depends on size due to adaptive strategy)
const small = produceFast([1, 2, 3], $ => $.push(4))
console.log(isPura(small))  // false (small → native)

const large = produceFast(Array(1000).fill(0), $ => $.push(1))
console.log(isPura(large))  // true (large → tree proxy)
```

## When to Use

### Type Checking

```typescript
function ensureNative<T>(data: T): T {
  return isPura(data) ? unpura(data) : data
}

// Usage
const result = ensureNative(maybeNativeOrPura)
externalLib.process(result)  // Always native
```

### Conditional Logic

```typescript
function process(data) {
  if (isPura(data)) {
    // Already Pura - use directly
    return produceFast(data, $ => {
      // ... mutations
    })
  } else {
    // Native - will be wrapped automatically
    return produceFast(data, $ => {
      // ... mutations
    })
  }
}
```

### Debugging

```typescript
function debug(value) {
  console.log('Type:', isPura(value) ? 'Pura proxy' : 'Native')
  console.log('Value:', unpura(value))  // Always show as native
}
```

## Adaptive Strategy

Due to Pura's adaptive strategy, `isPura()` result depends on size:

**Small collections (<512) → Native**

```typescript
const small = [1, 2, 3]
const result = produceFast(small, $ => $.push(4))

console.log(isPura(result))  // false
// Pura uses native for small collections (zero overhead!)
```

**Large collections (>=512) → Tree**

```typescript
const large = Array(1000).fill(0)
const result = produceFast(large, $ => $.push(1))

console.log(isPura(result))  // true
// Pura uses persistent tree for large collections
```

See [Understanding Adaptive Strategy](/guide/understanding-adaptive) for details.

## Type Safety

Works with generic types:

```typescript
interface User {
  name: string
  age: number
}

function processUser(user: User | PuraProxy<User>) {
  if (isPura(user)) {
    // user is PuraProxy<User>
  } else {
    // user is User (native)
  }
}
```

## Examples

### Ensure Native for Library

```typescript
import { isPura, unpura } from 'pura'

function callLibrary(data) {
  const native = isPura(data) ? unpura(data) : data
  externalLib.process(native)
}
```

### Performance Branch

```typescript
import { isPura, unpura } from 'pura'

function intensiveComputation(data) {
  // Convert to native for hot loop
  const native = isPura(data) ? unpura(data) : data

  let sum = 0
  for (let i = 0; i < native.length; i++) {
    sum += compute(native[i])
  }
  return sum
}
```

### Debug Helper

```typescript
import { isPura, unpura } from 'pura'

function inspectData(label, data) {
  console.log(label, {
    type: isPura(data) ? 'Pura' : 'Native',
    size: Array.isArray(data) ? data.length : data.size,
    sample: unpura(data)
  })
}
```

## Related Functions

- [`unpura()`](/api/unpura) - Convert to native JavaScript
- [`pura()`](/api/pura) - Wrap value in persistent structure

## Next Steps

- [Understanding Adaptive Strategy](/guide/understanding-adaptive) - When Pura uses native vs trees
- [unpura() Guide](/guide/unpura) - Converting back to native
- [Performance Guide](/guide/performance) - Optimization tips
