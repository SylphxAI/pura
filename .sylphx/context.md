# Project Context

## What (Internal)
Pura - TypeScript immutable state library with adaptive optimization.
Scope: Persistent data structures (Array, Map, Set, Object) with automatic native/proxy switching.
Target: TS developers needing immutable state with native-level performance for small data.
Out: Distributed systems, cloud features, UI components.

## Why (Business/Internal)
Gap: Immer is slow for small data (always uses Proxy). Pura adapts based on size.
Innovation: Adaptive threshold - small data returns native copies, large data uses persistent structures (RRB-Tree/HAMT).
Opportunity: Best of both worlds - native performance for common cases, structural sharing for large data.

## Key Constraints
- Technical:
  - Threshold = 512 elements (Array/Map/Set/Object)
  - Small (<512): Returns native copy (no proxy overhead)
  - Large (≥512): Returns proxy with persistent structures (RRB-Tree for Array, HAMT for Map/Set/Object)
- Business:
  - Zero runtime overhead for small data (most common use case)
  - Structural sharing only when beneficial (large data)
- Legal: MIT license

## User-Facing API
Three primary APIs for users:
1. **`produce(data, recipe)`** - Immutable mutation with proxy tracking (convenient but has overhead)
2. **`produceFast(data, recipe)`** - Immutable mutation without proxy tracking (explicit paths, near-native performance)
3. **`unpura(data)`** - Convert back to native JavaScript

Internal API (not recommended for direct use):
- **`pura(data)`** - Adaptive wrapper (automatically called by `produce`)

## Boundaries
**In scope:**
- Adaptive optimization (automatic native/proxy switching)
- Immutable operations via `produce()` and `produceFast()`
- Direct mutation support (mutable semantics)
- Read/write performance optimization
- Path-based mutations for explicit change tracking

**Out of scope:**
- Custom data structures beyond Array/Map/Set/Object
- Distributed state synchronization
- Time-travel debugging (may add later)

## SSOT References
- Dependencies: `package.json`
- Thresholds: `packages/core/src/internal/adaptive-thresholds.ts`
- Benchmarks: `benchmarks/` directory
