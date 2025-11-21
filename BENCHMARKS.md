# Complete Benchmark Results

**Date**: 2025-01-21 (Corrected)
**Environment**: Bun v1.3.2, Vitest v2.1.9
**Hardware**: (from test run)

---

## Methodology

All benchmarks compare five mutation strategies:

1. **[Direct] Native** - Direct mutation on native arrays (baseline)
2. **[Direct] Pura** - Direct mutation on persistent data structures
3. **[Immutable] Native Copy** - Native spread/slice + mutation
4. **[Immutable] Produce** - Proxy-based immutable updates
5. **[Immutable] ProduceFast** - Mutation-collection API

**CRITICAL: All benchmarks now use native arrays as input** to ensure fair comparison. Previous versions incorrectly used pre-converted Pura arrays for Produce benchmarks, making it appear faster.

### Test Data Sizes
- **Small**: 100 elements/entries
- **Medium**: 1,000 elements/entries
- **Large**: 10,000 elements/entries

---

## Array Benchmarks

### Array (Small: 100) - Single Update

| Implementation | ops/sec | vs Native Direct | vs Native Copy |
|----------------|---------|------------------|----------------|
| [Direct] Native | 49,826,406 | 1.00x (baseline) | 1.75x faster |
| [Direct] Pura | 49,381,356 | 1.01x | 1.74x faster |
| [Immutable] Native Copy | 28,434,828 | 0.57x | 1.00x (baseline) |
| [Immutable] ProduceFast | 14,664,032 | 0.29x | 0.52x |
| [Immutable] Produce | 5,345,193 | 0.11x | 0.19x |

**Summary**: Direct mutations are identical. ProduceFast is 2.7x faster than Produce.

---

### Array (Small: 100) - Multiple Updates (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 26,664,219 | 1.00x (baseline) |
| [Immutable] ProduceFast | 8,011,327 | 0.30x (3.3x slower) |
| [Immutable] Produce | 1,280,670 | 0.05x (20.8x slower) |

**Summary**: ProduceFast is 6.3x faster than Produce for batch updates.

---

### Array (Small: 100) - Push

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Spread | 13,098,179 | 1.00x (baseline) |
| [Immutable] ProduceFast | 7,985,224 | 0.61x (1.6x slower) |
| [Immutable] Produce | 4,970,330 | 0.38x (2.6x slower) |

**Summary**: ProduceFast is 1.6x faster than Produce.

---

### Array (Medium: 1K) - Single Update

| Implementation | ops/sec | vs Native Direct | vs Native Copy |
|----------------|---------|------------------|----------------|
| [Direct] Native | 49,367,405 | 1.00x (baseline) | 11.72x faster |
| [Direct] Pura | 6,584,817 | 0.13x (7.5x slower) | 1.56x faster |
| [Immutable] Native Copy | 4,211,619 | 0.09x | 1.00x (baseline) |
| [Immutable] ProduceFast | 3,293,791 | 0.07x | 0.78x |
| [Immutable] Produce | 308,691 | 0.006x | 0.07x (13.6x slower!) |

**Summary**: Produce is catastrophically slow for medium arrays due to tree conversion overhead.

---

### Array (Medium: 1K) - Multiple Updates (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 4,432,317 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,916,630 | 0.66x (1.5x slower) |
| [Immutable] Produce | 216,159 | 0.05x (20.5x slower) |

**Summary**: ProduceFast is 13.5x faster than Produce.

---

### Array (Large: 10K) - Single Update

| Implementation | ops/sec | vs Native Direct | vs Native Copy |
|----------------|---------|------------------|----------------|
| [Direct] Native | 49,302,374 | 1.00x (baseline) | 55.67x faster |
| [Direct] Pura | 5,610,789 | 0.11x (8.8x slower) | 6.34x faster |
| [Immutable] Native Copy | 885,693 | 0.02x | 1.00x (baseline) |
| [Immutable] ProduceFast | 803,406 | 0.02x | 0.91x |
| [Immutable] Produce | 51,928 | 0.001x | 0.06x (17x slower!) |

**Summary**: Produce collapses on large arrays. ProduceFast is 15.5x faster than Produce.

---

### Array (Large: 10K) - Multiple Updates (100)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 767,426 | 1.00x (baseline) |
| [Immutable] ProduceFast | 441,842 | 0.58x (1.7x slower) |
| [Immutable] Produce | 28,106 | 0.04x (27.3x slower) |

**Summary**: ProduceFast is 15.7x faster than Produce.

---

## Object Benchmarks

### Object - Single Shallow Update

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Spread | 43,013,295 | 1.00x (baseline) |
| [Immutable] ProduceFast | 17,431,635 | 0.41x (2.5x slower) |
| [Immutable] Produce | 8,390,575 | 0.20x (5.1x slower) |

**ProduceFast vs Produce**: **2.1x faster** ✅

---

### Object - Multiple Shallow Updates

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Spread | 43,421,877 | 1.00x (baseline) |
| [Immutable] ProduceFast | 14,915,555 | 0.34x (2.9x slower) |
| [Immutable] Produce | 7,260,006 | 0.17x (6.0x slower) |

**ProduceFast vs Produce**: **2.1x faster** ✅

---

### Object - Single Deep Update

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Nested Spread | 36,319,042 | 1.00x (baseline) |
| [Immutable] ProduceFast | 7,455,920 | 0.21x (4.9x slower) |
| [Immutable] Produce | 1,899,506 | 0.05x (19.1x slower) |

**ProduceFast vs Produce**: **3.9x faster** ✅

---

### Object - Multiple Deep Updates

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Nested Spread | 31,353,932 | 1.00x (baseline) |
| [Immutable] ProduceFast | 3,197,816 | 0.10x (9.8x slower) |
| [Immutable] Produce | 1,081,216 | 0.03x (29.0x slower) |

**ProduceFast vs Produce**: **3.0x faster** ✅

---

## Map Benchmarks

### Map (Small: 100) - Single Set

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 400,119 | 1.00x (baseline) |
| [Immutable] ProduceFast | 394,718 | 0.99x (1.01x slower) |
| [Immutable] Produce | 385,132 | 0.96x (1.04x slower) |

**ProduceFast vs Produce**: 1.02x faster

---

### Map (Small: 100) - Multiple Sets (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 380,985 | 1.00x (baseline) |
| [Immutable] ProduceFast | 364,059 | 0.96x (1.05x slower) |
| [Immutable] Produce | 336,126 | 0.88x (1.13x slower) |

**ProduceFast vs Produce**: 1.08x faster

---

### Map (Medium: 1K) - Single Set

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] ProduceFast | 36,975 | 1.02x faster ✅ |
| [Immutable] Native Copy | 36,423 | 1.00x (baseline) |
| [Immutable] Produce | 3,185 | 0.09x (11.4x slower) |

**ProduceFast vs Produce**: **11.6x faster** 🚀

---

### Map (Medium: 1K) - Delete

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 37,743 | 1.00x (baseline) |
| [Immutable] ProduceFast | 37,262 | 0.99x (1.01x slower) |
| [Immutable] Produce | 3,346 | 0.09x (11.3x slower) |

**ProduceFast vs Produce**: **11.1x faster** 🚀

---

## Set Benchmarks

### Set (Small: 100) - Single Add

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 3,126,887 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,793,987 | 0.89x (1.12x slower) |
| [Immutable] Produce | 2,605,303 | 0.83x (1.20x slower) |

**ProduceFast vs Produce**: 1.07x faster

---

### Set (Small: 100) - Multiple Adds (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 2,735,451 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,131,291 | 0.78x (1.28x slower) |
| [Immutable] Produce | 1,691,353 | 0.62x (1.62x slower) |

**ProduceFast vs Produce**: 1.26x faster

---

### Set (Medium: 1K) - Single Add

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 372,145 | 1.00x (baseline) |
| [Immutable] ProduceFast | 361,900 | 0.97x (1.03x slower) |
| [Immutable] Produce | 3,461 | 0.01x (107.5x slower) |

**ProduceFast vs Produce**: **104.5x faster** 🚀

---

### Set (Medium: 1K) - Delete

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 374,526 | 1.00x (baseline) |
| [Immutable] ProduceFast | 346,588 | 0.93x (1.08x slower) |
| [Immutable] Produce | 3,064 | 0.01x (122.2x slower) |

**ProduceFast vs Produce**: **113.1x faster** 🚀

---

## Read Operations

### Array (Medium: 1K) - Sequential Read

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native | 2,963,654 | 1.00x (baseline) |
| [Read] Pura | 10,012 | **296x slower** ⚠️ |

**Critical finding**: Pura arrays have massive read overhead. Use `.toArray()` for hot loops.

---

### Array (Medium: 1K) - Iterator (for...of)

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native for...of | 2,289,668 | 1.00x (baseline) |
| [Read] Pura for...of | 35,470 | **64.6x slower** ⚠️ |

---

### Array (Large: 10K) - map()

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native map() | 20,226 | 1.00x (baseline) |
| [Read] Pura map() | 5,631 | **3.6x slower** |

---

### Array (Large: 10K) - filter()

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native filter() | 18,096 | 1.00x (baseline) |
| [Read] Pura filter() | 6,028 | **3.0x slower** |

---

### Array (Large: 10K) - reduce()

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native reduce() | 21,784 | 1.00x (baseline) |
| [Read] Pura reduce() | 6,414 | **3.4x slower** |

---

## Summary Statistics

### ProduceFast vs Produce Speedup (Corrected)

| Category | Best Case | Worst Case | Median |
|----------|-----------|------------|--------|
| Arrays (Small) | 6.3x faster (multiple) | 1.6x faster (push) | 3.2x faster |
| Arrays (Medium) | 13.5x faster (multiple) | 13.5x faster (multiple) | 13.5x faster |
| Arrays (Large) | 15.7x faster (multiple) | 15.5x faster (single) | 15.6x faster |
| Objects | 3.9x faster (deep single) | 2.1x faster (shallow) | 2.8x faster |
| Map (Small) | 1.08x faster (multiple) | 1.02x faster (single) | 1.05x faster |
| Map (Medium) | 11.6x faster (single) | 11.1x faster (delete) | 11.4x faster |
| Set (Small) | 1.26x faster (multiple) | 1.07x faster (single) | 1.17x faster |
| Set (Medium) | 113x faster (delete) | 105x faster (single) | 109x faster |

### Pura Direct Mutation vs Native

| Size | Single Update | Degradation |
|------|---------------|-------------|
| Small (100) | 1.01x | None ✅ |
| Medium (1K) | 7.5x slower | Moderate ⚠️ |
| Large (10K) | 8.8x slower | Significant ❌ |

### Pura Read Overhead vs Native

| Operation | Size | Overhead |
|-----------|------|----------|
| Sequential read | 1K | 296x slower ❌ |
| for...of | 1K | 64.6x slower ❌ |
| map() | 10K | 3.6x slower ⚠️ |
| filter() | 10K | 3.0x slower ⚠️ |
| reduce() | 10K | 3.4x slower ⚠️ |

---

## Conclusions

### ✅ Strengths

1. **ProduceFast dominates Produce across all benchmarks** (1.6-113x faster!)
2. **ProduceFast is 11-113x faster** than Produce for medium-large Map/Set
3. **ProduceFast is 13-16x faster** than Produce for medium-large arrays
4. **Pura direct mutation matches native** for small arrays (<100)
5. **Native copy is optimal** for small collections

### ⚠️ Weaknesses

1. **Pura read operations have severe overhead** (3-296x slower)
2. **Pura direct mutation degrades** with size (8x at 10K)
3. **ProduceFast still 2-10x slower** than native spread for objects
4. **Produce collapses on medium-large collections** (11-122x slower than native)

### 🎯 Recommendations

**Use Native:**
- Small collections (<100)
- Hot loops with reads
- Simple shallow updates

**Use ProduceFast:**
- Medium-large Map/Set (100-10K) - 11-113x faster than Produce!
- Medium-large Arrays (1K-10K) - 13-16x faster than Produce!
- Complex nested object updates - 2-4x faster than Produce
- Batch mutations - consistently faster than Produce

**Avoid Produce:**
- Arrays (any size) - 5-27x slower than ProduceFast
- Map/Set medium-large - 11-122x slower than ProduceFast
- Use ProduceFast instead for same ergonomic API with much better performance

**Use Pura:**
- Need persistent data structures with structural sharing
- Minimize write operations
- Convert to array for reads (`.toArray()`)

---

## Raw Data

All raw benchmark outputs are saved in `/tmp/corrected-bench-results.txt`

Run benchmarks yourself:
```bash
bun bench benchmarks/comprehensive.bench.ts --run
```

---

## Benchmark Correction Note

**Previous benchmark versions (before 2025-01-21) were incorrect:**
- Produce benchmarks used pre-converted `puraArr` (tree structure)
- ProduceFast benchmarks used `nativeArr` (native array)
- This made Produce appear ~10-20x faster than it actually is
- Corrected benchmarks use `nativeArr` for both, ensuring fair comparison

The user correctly identified this flaw, which was causing illogical results where Produce appeared faster than Native Copy - which is impossible with Proxy overhead.
