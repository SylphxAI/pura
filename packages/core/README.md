# @pura/core

Core persistent data structures for Pura.

## Collections

- **IList**: Persistent List (RRB-Tree) - O(log n) operations
- **IMap**: Persistent Map (HAMT) - O(1) operations
- **ISet**: Persistent Set (HAMT-based) - O(1) operations

## Installation

```bash
npm install @pura/core
```

## Usage

```typescript
import { IList, IMap, ISet } from '@pura/core'

const list = IList.of(1, 2, 3)
const map = IMap.of({ a: 1, b: 2 })
const set = ISet.of(1, 2, 3)
```

## Documentation

See main [Pura documentation](../../README.md).
