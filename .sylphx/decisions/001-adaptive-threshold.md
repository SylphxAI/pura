# 001. Adaptive Threshold Strategy

**Status:** ✅ Accepted
**Date:** 2024-01-21

## Context
Immer always uses Proxy for immutable operations, causing overhead even for small data structures. Most real-world usage involves small data (arrays with <100 elements).

## Decision
Use adaptive threshold of 512 elements. Below threshold, return native copies. At/above threshold, use persistent structures (RRB-Tree for arrays, HAMT for maps/sets/objects).

## Rationale
- Benchmarks show proxy overhead is 3-20x for reads on small data
- Native copy is acceptable for small data (still faster than proxy reads)
- 512 chosen based on performance testing - balancing copy cost vs proxy overhead
- Most applications use small data structures (<100 elements in practice)

## Consequences
**Positive:**
- Zero proxy overhead for common case (small data)
- Native-level read performance for <512 elements
- Still get structural sharing benefits for large data

**Negative:**
- Copy overhead for writes on small data (acceptable trade-off)
- Memory spike during produce() for data near threshold (copying ~512 elements)
- Threshold is magic number (but tunable via central config)

## References
- Implementation: `packages/core/src/internal/adaptive-thresholds.ts`
- Benchmarks: `benchmarks/*.bench.ts`
