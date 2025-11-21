# 003. Dual Mutation Semantics

**Status:** ✅ Accepted
**Date:** 2024-01-21

## Context
Immer only supports immutable semantics via `produce()`. Some use cases benefit from direct mutation (e.g., temporary local state, performance-critical loops).

## Decision
Support both mutation semantics:
1. **Direct mutation**: `puraArray[i] = x`, `puraMap.set(k, v)` (mutable)
2. **Immutable mutation**: `produce(pura, draft => ...)` (immutable, structural sharing)

Both work on pura data (whether native or proxy).

## Rationale
- Flexibility: Users choose based on context (local state vs shared state)
- Performance: Direct mutation faster for small, temporary data
- Compatibility: Direct mutation enables drop-in replacement for native JS
- Immutability: `produce()` for shared state, time-travel, undo/redo

## Consequences
**Positive:**
- Best of both worlds: mutable when needed, immutable when desired
- Drop-in replacement for native JS (supports same mutation API)
- No forced immutability overhead for local state

**Negative:**
- Users must choose correctly (easy to mutate shared state by mistake)
- API surface larger (two ways to mutate)
- Documentation must clearly explain when to use each

## References
- Implementation: `packages/core/src/index.ts` - Both APIs available
- Tests: `packages/core/src/__tests__/produce.test.ts`
