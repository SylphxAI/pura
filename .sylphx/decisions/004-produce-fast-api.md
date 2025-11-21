# 004. ProduceFast API - Explicit Mutations Without Proxy

**Status:** 🚧 Proposed
**Date:** 2025-01-21

## Context
`produce()` uses Proxy to track mutations, which adds overhead (~3-20x for small data reads, overhead in writes). For performance-critical code paths, users need a way to perform immutable updates without proxy overhead while still maintaining immutability.

## Decision
Add `produceFast()` API that requires explicit path-based mutations instead of proxy tracking.

### API Design - Option A (Recommended)

```typescript
// Helper object with path-based methods
produceFast(obj, $ => {
  $.set(['a', 'b'], 1);           // Set nested value
  $.update(['c'], x => x + 1);    // Update with function
  $.delete(['d', 'e']);            // Delete nested key
  $.merge(['f'], { x: 1 });        // Shallow merge at path
});
```

**Array operations:**
```typescript
produceFast(arr, $ => {
  $.set([0], 'new value');         // Update index
  $.push('item');                   // Push
  $.splice([2, 1]);                 // Remove 1 item at index 2
  $.filter((x, i) => i % 2 === 0); // Filter even indices
});
```

**Map/Set operations:**
```typescript
produceFast(map, $ => {
  $.set(['key1'], 'value');        // Map.set
  $.delete(['key2']);               // Map.delete
});

produceFast(set, $ => {
  $.add('item');                    // Set.add
  $.delete('item');                 // Set.delete
});
```

### API Design - Option B (Alternative)

Standalone helper functions (similar to Ramda/lodash/fp):

```typescript
import { setIn, updateIn, deleteIn, mergeIn } from 'pura/fast';

const obj1 = setIn(obj, ['a', 'b'], 1);
const obj2 = updateIn(obj, ['c'], x => x + 1);
const obj3 = deleteIn(obj, ['d', 'e']);
const obj4 = mergeIn(obj, ['f'], { x: 1 });
```

## Rationale
- **Performance**: No proxy overhead, uses native copy operations (spread/slice/structuredClone)
- **Explicitness**: User clearly specifies what changes (vs proxy auto-tracking)
- **Predictability**: Performance is predictable (near-native)
- **Use case**: Hot paths, simple mutations, performance-critical code

**Why Option A preferred:**
- Single function call for multiple mutations (more efficient)
- Consistent API with `produce()`
- Clear separation: `produce` = convenient, `produceFast` = performant
- Helper object `$` is discoverable (autocomplete shows all methods)

**Why Option B alternative:**
- More functional/composable
- Each operation is standalone (easier to tree-shake)
- Familiar to users of Ramda/lodash/fp

## Trade-offs

**Positive:**
- Near-native performance (no proxy overhead)
- Still immutable (returns new copy)
- Explicit mutations (easier to reason about performance)
- Can be faster than `produce()` even for large data (no tracking overhead)

**Negative:**
- More verbose than `produce()` (must specify paths explicitly)
- Less convenient for complex nested mutations
- No structural sharing (always native copy)
- Array operations require rethinking (can't just `arr[i] = x`)

## Implementation Strategy

```typescript
type Path = (string | number)[];

interface FastHelper {
  // Object/Map
  set(path: Path, value: any): void;
  update(path: Path, fn: (old: any) => any): void;
  delete(path: Path): void;
  merge(path: Path, value: any): void;

  // Array
  push(...items: any[]): void;
  splice(args: [start: number, deleteCount?: number, ...items: any[]]): void;
  filter(fn: (item: any, index: number) => boolean): void;

  // Set
  add(value: any): void;
}

export function produceFast<T>(
  base: T,
  recipe: (helper: FastHelper) => void
): T {
  // 1. Create working copy (structured clone or shallow copy)
  const copy = createCopy(base);

  // 2. Apply mutations via helper
  const helper = createHelper(copy);
  recipe(helper);

  // 3. Return native copy (no pura wrapping)
  return copy;
}
```

**Copy strategy:**
- Objects/Arrays: Shallow copy + copy-on-write for nested paths
- Map/Set: `new Map(base)` / `new Set(base)`
- Only copy paths that are modified (minimal copying)

## Performance Expectations

| Operation | produce() | produceFast() | Native |
|-----------|-----------|---------------|--------|
| Small data single update | ~5x slower | ~1.1x slower | 1x (baseline) |
| Small data multi update | ~10x slower | ~1.2x slower | 1x |
| Large data single update | ~1.2x faster | ~1.1x slower | 1x |
| Large data multi update | ~4x faster | ~1.5x slower | 1x |

Goal: `produceFast` should be within 1.5x of native immutable operations.

## Examples

**Before (with produce):**
```typescript
const newState = produce(state, draft => {
  draft.user.name = 'Alice';
  draft.user.age = 30;
  draft.items.push({ id: 1 });
});
// Convenient but has proxy overhead
```

**After (with produceFast):**
```typescript
const newState = produceFast(state, $ => {
  $.set(['user', 'name'], 'Alice');
  $.set(['user', 'age'], 30);
  $.push('items', { id: 1 });
});
// More explicit but near-native performance
```

**When to use which:**
- Use `produce()`: Complex logic, many nested mutations, convenience matters
- Use `produceFast()`: Hot paths, simple mutations, performance critical

## References
- Similar: Immutable.js `setIn`/`updateIn`, Ramda `assocPath`/`dissocPath`
- Implementation: `packages/core/src/produce-fast.ts` (to be created)
- Tests: `packages/core/src/produce-fast.test.ts` (to be created)
- Benchmarks: `benchmarks/produce-fast.bench.ts` (to be created)
