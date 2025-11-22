---
layout: home

hero:
  name: Pura
  text: Pure FP for TypeScript
  tagline: Returns native JavaScript types. Immutability faster than mutation. Zero learning curve.
  image:
    src: /logo.svg
    alt: Pura Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/sylphxltd/pura

features:
  - icon: 🎯
    title: Returns Native Types
    details: Real Array/Object/Map/Set - not custom wrappers like Immutable.js. Works everywhere. Zero learning curve. 100% library compatible.

  - icon: ⚡
    title: Blazing Fast
    details: 1.06-105x faster than Immer. O(log n) operations with structural sharing via HAMT & RRB-Trees.

  - icon: 🔄
    title: Dual Mode Support
    details: Use immutably with produce() or mutably when needed. Both patterns supported on the same data structures.

  - icon: 🔒
    title: Type-Safe
    details: Perfect TypeScript inference. Zero `any` types. Full type safety end-to-end.

  - icon: 🪶
    title: Lightweight
    details: <8KB gzipped core. Excellent tree-shaking. No runtime dependencies.

  - icon: 🔄
    title: Adaptive
    details: Small collections (<512) use native arrays/maps/sets (zero overhead). Large collections use persistent trees.

  - icon: 📦
    title: Two APIs
    details: produce() for Immer compatibility. produceFast() for maximum performance (helper-based).

  - icon: 🚀
    title: Production-Ready
    details: Battle-tested algorithms, comprehensive tests, benchmarked against Immer.

  - icon: 🎨
    title: Developer-Friendly
    details: Clean API, excellent docs, real-world examples, migration guides.
---

## Quick Example

```typescript
import { produce } from '@sylphx/pura'

// Returns real Array - use it anywhere!
const state = [1, 2, 3]
const next = produce(state, draft => {
  draft.push(4)
  draft[0] = 999
})

// next is a real Array
next[0]              // ✅ works - it's a real Array
next instanceof Array // ✅ true
await api.send(next)  // ✅ works with any library

// Objects - returns real Object
const user = { name: 'John', age: 30 }
const updated = produce(user, draft => {
  draft.age = 31
})

// Maps & Sets - returns real Map/Set
const map = new Map([['a', 1]])
const newMap = produce(map, draft => {
  draft.set('b', 2)
})
newMap.get('b')      // ✅ works - it's a real Map
```

## Why Pura?

### vs Immer

**1.06-105x faster** across all scenarios. Structural sharing for arrays/maps/sets (Immer only does objects).

### vs Manual Immutability

**O(log n) vs O(n)**. Updating element 500 in a 10K array:
- Manual: Copy entire array (10,000 elements)
- Pura: Update path to node (~4 nodes)

### vs Immutable.js

**Returns native types** (Immutable.js uses custom `List`/`Map` wrappers). Zero learning curve. Use `result[0]` not `result.get(0)`. Works with any library expecting native types.

## Performance

<div class="performance-grid">

| Scenario | Immer | Pura | Speedup |
|----------|-------|------|---------|
| **Sets (1K)** | 2.31K ops/s | **243K ops/s** | **105x faster** 🚀 |
| **Maps (1K)** | 2.08K ops/s | **25.1K ops/s** | **12x faster** 🚀 |
| **Objects (Deep)** | 681K ops/s | **1.70M ops/s** | **2.5x faster** ✅ |
| **Arrays (100)** | 0.87M ops/s | **4.63M ops/s** | **5.3x faster** ✅ |

</div>

## Installation

```bash
npm install pura
# or
bun add pura
# or
pnpm add pura
```

## Learn More

- [Getting Started](/guide/getting-started) - Installation and first steps
- [API Reference](/api/reference) - Complete API documentation
- [Migration from Immer](/guide/migration-from-immer) - Easy migration guide
- [Examples](/examples/arrays) - Real-world usage examples
