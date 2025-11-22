---
layout: home

hero:
  name: Pura
  text: Pure FP for TypeScript
  tagline: Fast, Type-Safe, Zero Compromise. Make immutable updates faster than mutation.
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
  - icon: ⚡
    title: Blazing Fast
    details: 1.06-105x faster than Immer. O(log n) operations with structural sharing via HAMT & RRB-Trees.

  - icon: 🔒
    title: Immutable by Design
    details: Persistent data structures proven in Clojure/Scala. Copy-on-write ensures safety.

  - icon: 🎯
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
import { produceFast } from 'pura'

// Arrays - no wrapper needed!
const state = [1, 2, 3]
const newState = produceFast(state, $ => {
  $.set(0, 999)      // Update index
  $.push(4)          // Add element
})

// Objects - deep updates with path syntax
const user = { name: 'John', profile: { age: 30 } }
const updated = produceFast(user, $ => {
  $.set(['profile', 'age'], 31)
})

// Maps & Sets
const map = new Map([['a', 1], ['b', 2]])
const newMap = produceFast(map, $ => {
  $.set('c', 3)
  $.delete('a')
})
```

## Why Pura?

### vs Immer

**1.06-105x faster** across all scenarios. Structural sharing for arrays/maps/sets (Immer only does objects).

### vs Manual Immutability

**O(log n) vs O(n)**. Updating element 500 in a 10K array:
- Manual: Copy entire array (10,000 elements)
- Pura: Update path to node (~4 nodes)

### vs Immutable.js

**Native API**. No learning curve. Better tree-shaking. TypeScript-first design.

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
