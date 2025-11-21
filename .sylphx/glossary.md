# Glossary

## Adaptive Optimization
**Definition:** Automatic switching between native JS and persistent data structures based on size threshold.
**Usage:** `packages/core/src/index.ts` - All `pura()` functions
**Context:** Small data (<512) returns native copy (no proxy), large data (≥512) returns proxy with persistent structures. Optimizes for common case (small data) while supporting efficient large data operations.

## Pura
**Definition:** Adaptive wrapper function that returns optimized data structure.
**Usage:** `pura(data)` - Main API entry point
**Context:** Returns native copy for small data, proxy for large data. Does NOT mutate input.

## Produce
**Definition:** Immutable mutation function (Immer-like).
**Usage:** `produce(puraData, recipe)` - Immutable operations
**Context:** Always returns new snapshot (structurally shared for large data). Original unchanged. Recipe receives draft proxy for mutations.

## Unpura
**Definition:** Convert pura data back to native JavaScript.
**Usage:** `unpura(puraData)` - Extract native data
**Context:** Returns plain JS object/array/map/set. Use when passing to external libraries or serializing.

## Adaptive Threshold
**Definition:** Size limit where pura switches from native to proxy.
**Usage:** `packages/core/src/internal/adaptive-thresholds.ts`
**Context:** Currently 512 for all types (Array/Map/Set/Object). Based on performance benchmarks - proxy overhead not worth it for smaller data.

## RRB-Tree (Relaxed Radix Balanced Tree)
**Definition:** Persistent vector data structure for arrays.
**Usage:** `packages/core/src/internal/vec.ts`
**Context:** Used for large arrays (≥512). Provides O(log n) updates with structural sharing. Read overhead ~3-20x vs native.

## HAMT (Hash Array Mapped Trie)
**Definition:** Persistent hash map for Map/Set/Object.
**Usage:** `packages/core/src/internal/hamt.ts`
**Context:** Used for large maps/sets/objects (≥512). Provides O(log n) updates with structural sharing.

## Structural Sharing
**Definition:** Reusing unchanged portions of data structure across versions.
**Usage:** All persistent structures (RRB-Tree, HAMT)
**Context:** Enables efficient immutable updates for large data. Only modified paths are copied.

## Draft Proxy
**Definition:** Temporary mutable proxy used inside `produce()`.
**Usage:** `produce(data, draft => { draft.x = y; })`
**Context:** Mutations on draft are tracked. Final result is immutable snapshot with structural sharing.

## Direct Mutation
**Definition:** In-place mutation of pura data structure.
**Usage:** `puraArray[i] = x`, `puraMap.set(k, v)`
**Context:** Mutable semantics. Modifies original object. Available for both native and proxy pura data.

## Immutable Mutation
**Definition:** Creating new version via `produce()`.
**Usage:** `produce(data, draft => ...)`
**Context:** Immutable semantics. Original unchanged. Returns new snapshot.
