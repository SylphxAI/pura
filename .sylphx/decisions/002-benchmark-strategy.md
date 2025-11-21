# 002. Four-Way Benchmark Comparison

**Status:** ✅ Accepted
**Date:** 2024-01-21

## Context
Initial benchmarks only compared Native immutable (copy) vs Pura immutable (produce), missing direct mutation comparisons. This incomplete picture didn't show that Pura supports both mutable and immutable semantics.

## Decision
Every write operation benchmark must include 4 tests:
1. Native (direct mutate) - `native.set()`
2. Pura (direct mutate) - `pura.set()`
3. Native (copy then set) - `new Map(native).set()`
4. Pura (produce) - `produce(pura, draft => draft.set())`

Read operations: 2-way comparison (Native vs Pura only)

## Rationale
- Shows complete performance picture for both mutation semantics
- Direct mutation comparison proves small data has no proxy overhead
- Immutable comparison shows structural sharing benefits for large data
- Users can choose appropriate API based on their needs

## Consequences
**Positive:**
- Complete performance data for all use cases
- Clear comparison: mutable vs immutable semantics
- Validates that small data direct mutation = native speed

**Negative:**
- More benchmarks to maintain (4 instead of 2-3)
- Benchmark files are larger

## References
- Implementation: All `benchmarks/*.bench.ts` files
- Example: `benchmarks/map.bench.ts` - "Medium map - Object keys"
