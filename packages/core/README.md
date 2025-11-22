# @sylphx/pura

**Pure FP for TypeScript** - Fast, Type-Safe, Zero Compromise

Persistent data structures (HAMT, RRB-Tree) that make immutability faster than mutation.

## Features

- 🚀 **Faster than mutation** - Structural sharing beats copying
- 🔒 **Type-safe** - Full TypeScript support with inference
- 🎯 **Immer-like API** - Familiar `produce()` interface
- 📦 **Zero dependencies** - Lightweight and fast
- 🌳 **Persistent data structures** - HAMT maps and RRB-Tree arrays

## Installation

```bash
npm install @sylphx/pura
```

## Quick Start

```typescript
import { produce } from '@sylphx/pura'

// Immer-like produce API
const state = { count: 0, items: [1, 2, 3] }

const next = produce(state, draft => {
  draft.count++
  draft.items.push(4)
})

console.log(state.count) // 0 (unchanged)
console.log(next.count)  // 1 (new state)
```

## Core APIs

### `produce(base, recipe)`

Create new state by mutating a draft. Works like Immer.

```typescript
const user = { name: 'Alice', age: 30 }
const updated = produce(user, draft => {
  draft.age = 31
})
```

### `pura(value)` / `unpura(value)`

Convert between plain objects and persistent structures for maximum performance.

```typescript
import { pura, unpura, produce } from '@sylphx/pura'

// Wrap data for persistent operations
const wrapped = pura({ items: [1, 2, 3] })

// Fast updates on persistent structures
const updated = produce(wrapped, draft => {
  draft.items.push(4)
})

// Unwrap back to plain objects when needed
const plain = unpura(updated)
```

## Performance

Pura uses advanced persistent data structures (HAMT for objects/maps, RRB-Tree for arrays) that share structure between versions. This makes immutable updates faster than copying, especially for large datasets.

**Adaptive strategies**: Small collections use native objects/arrays. Large collections automatically upgrade to persistent structures. Best of both worlds.

## Documentation

Full documentation available at **[pura.sylphx.com](https://pura.sylphx.com)**

- [Getting Started](https://pura.sylphx.com/guide/getting-started)
- [API Reference](https://pura.sylphx.com/api/)
- [Performance Guide](https://pura.sylphx.com/guide/performance)
- [Migration from Immer](https://pura.sylphx.com/guide/migration)

## License

MIT © [SylphX Ltd](https://github.com/SylphxAI)

## Links

- [Documentation](https://pura.sylphx.com)
- [GitHub](https://github.com/SylphxAI/Pura)
- [Issues](https://github.com/SylphxAI/Pura/issues)
- [npm](https://www.npmjs.com/package/@sylphx/pura)
