# Architecture

## System Overview
Pura is an adaptive immutable state library. Data structures automatically switch between native JavaScript and persistent data structures based on size thresholds (512 elements).

Core API:
- `pura(data)` - Adaptive wrapper (returns native or proxy based on size)
- `produce(data, recipe)` - Immutable mutation (always returns new snapshot)
- `unpura(data)` - Convert proxy back to native

Flow: User data → `pura()` → Adaptive (native/proxy) → `produce()` → New snapshot → `unpura()` → Native

## Key Components

### Core API (`packages/core/src/index.ts`)
- **`pura(data)`**: Adaptive wrapper
  - Input: Native JS data (Array/Map/Set/Object)
  - Output: Adaptive (small → native copy, large → proxy)
  - Threshold: 512 elements
  - Purpose: Optimize data structure based on size

- **`produce(data, recipe)`**: Immutable mutation
  - Input: Pura data (adaptive)
  - Output: New snapshot (always pura, adaptive)
  - Behavior: Structural sharing for large data, copy for small data
  - Purpose: Immer-like immutable semantics

- **`unpura(data)`**: Convert to native
  - Input: Pura data (proxy or native)
  - Output: Native JS data
  - Purpose: Extract plain JS object/array/map/set

### Adaptive Thresholds (`packages/core/src/internal/adaptive-thresholds.ts`)
Centralized threshold configuration:
```typescript
export const ARRAY_ADAPTIVE_THRESHOLD = 512;
export const OBJECT_ADAPTIVE_THRESHOLD = 512;
export const MAP_ADAPTIVE_THRESHOLD = 512;
export const SET_ADAPTIVE_THRESHOLD = 512;
```

### Persistent Data Structures
- **RRB-Tree** (`packages/core/src/internal/vec.ts`): Array ≥512
- **HAMT** (`packages/core/src/internal/hamt.ts`): Map/Set/Object ≥512
- **OrderIndex** (`packages/core/src/internal/order-index.ts`): Insertion order tracking

## Design Patterns

### Pattern: Adaptive Optimization
**Why:** Avoid proxy overhead for small data (most common case)
**Where:** All `pura()` functions
**Trade-off:**
- Small data: Native copy (fast read, slower write vs direct mutation)
- Large data: Proxy (slower read, much faster write via structural sharing)
**Decision:** Threshold = 512 (based on performance testing)

### Pattern: Dual Mutation Semantics
**Why:** Support both mutable and immutable workflows
**Where:** All pura data structures
**Operations:**
1. **Direct mutation**: `puraArray[i] = x`, `puraMap.set(k, v)` (mutable)
2. **Immutable mutation**: `produce(puraData, draft => ...)` (immutable)

**Trade-off:** Flexibility vs API surface complexity
**Decision:** Support both - users choose based on needs

## Benchmark Strategy

### Four-Way Comparison
Every operation should have 4 benchmarks:

| Mutation Type | Native | Pura |
|---------------|--------|------|
| **Direct (mutable)** | `native.set()` | `pura.set()` |
| **Immutable** | `new Map(native).set()` | `produce(pura, d => d.set())` |

**Read operations:** 2-way comparison (Native vs Pura)

### Size Categories
- **Small**: < threshold (e.g., 10, 100)
  - Pura returns native → read = native speed
  - Test: Verify no proxy overhead
- **Medium**: = threshold (e.g., 512, 1000)
  - Pura returns proxy → read slower
  - Test: Verify proxy overhead acceptable
- **Large**: >> threshold (e.g., 10000)
  - Pura returns proxy → write much faster
  - Test: Verify structural sharing wins

### Benchmark Structure
```typescript
describe('Small map (10) - Single set', () => {
  // Direct mutation
  bench('Native (direct mutate)', () => { native.set(); });
  bench('Pura (direct mutate)', () => { pura.set(); });

  // Immutable mutation
  bench('Native (copy then set)', () => { new Map(native).set(); });
  bench('Pura (produce)', () => { produce(pura, d => d.set()); });
});
```

## Boundaries
**In scope:** Core immutable operations, adaptive optimization
**Out of scope:** Time-travel, undo/redo, distributed sync

## SSOT
- API: `packages/core/src/index.ts`
- Thresholds: `packages/core/src/internal/adaptive-thresholds.ts`
- Benchmarks: `benchmarks/*.bench.ts`
