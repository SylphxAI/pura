# Complete Benchmark Results

**Date**: 2024-11-21
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

### Test Data Sizes
- **Small**: 100 elements/entries
- **Medium**: 1,000 elements/entries
- **Large**: 10,000 elements/entries

---

## Array Benchmarks

### Array (Small: 100) - Single Update

| Implementation | ops/sec | vs Native Direct | vs Native Copy |
|----------------|---------|------------------|----------------|
| [Direct] Native | 49,795,953 | 1.00x (baseline) | 1.75x faster |
| [Direct] Pura | 49,609,522 | 1.00x | 1.75x faster |
| [Immutable] Native Copy | 28,375,289 | 0.57x | 1.00x (baseline) |
| [Immutable] ProduceFast | 14,784,586 | 0.30x | 0.52x |
| [Immutable] Produce | 5,627,155 | 0.11x | 0.20x |

**Summary**: Direct mutations are identical. Produce is 8.85x slower than direct.

---

### Array (Small: 100) - Multiple Updates (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 26,391,117 | 1.00x (baseline) |
| [Immutable] ProduceFast | 8,244,111 | 0.31x (3.2x slower) |
| [Immutable] Produce | 1,281,899 | 0.05x (20.6x slower) |

**Summary**: Produce is catastrophically slow for batch updates (20x slower).

---

### Array (Small: 100) - Push

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Spread | 13,086,659 | 1.00x (baseline) |
| [Immutable] ProduceFast | 8,014,082 | 0.61x (1.6x slower) |
| [Immutable] Produce | 5,607,785 | 0.43x (2.3x slower) |

---

### Array (Medium: 1K) - Single Update

| Implementation | ops/sec | vs Native Direct | vs Native Copy |
|----------------|---------|------------------|----------------|
| [Direct] Native | 48,861,560 | 1.00x (baseline) | 15.95x faster |
| [Direct] Pura | 6,413,753 | 0.13x (7.6x slower) | 2.09x faster |
| [Immutable] Native Copy | 3,063,365 | 0.06x | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,488,924 | 0.05x | 0.81x |
| [Immutable] Produce | 806,718 | 0.02x | 0.26x |

**Summary**: Pura direct mutation starts to degrade at 1K elements (7.6x slower).

---

### Array (Medium: 1K) - Multiple Updates (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 3,805,569 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,685,186 | 0.71x (1.4x slower) |
| [Immutable] Produce | 348,709 | 0.09x (10.9x slower) |

---

### Array (Large: 10K) - Single Update

| Implementation | ops/sec | vs Native Direct | vs Native Copy |
|----------------|---------|------------------|----------------|
| [Direct] Native | 44,278,263 | 1.00x (baseline) | 50.6x faster |
| [Direct] Pura | 5,292,281 | 0.12x (8.4x slower) | 6.05x faster |
| [Immutable] Produce | 1,024,576 | 0.02x | 1.17x faster |
| [Immutable] Native Copy | 875,145 | 0.02x | 1.00x (baseline) |
| [Immutable] ProduceFast | 786,341 | 0.02x | 0.90x |

**Summary**: At 10K elements, all immutable strategies converge (native copy is slightly better).

---

### Array (Large: 10K) - Multiple Updates (100)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 765,886 | 1.00x (baseline) |
| [Immutable] ProduceFast | 460,323 | 0.60x (1.7x slower) |
| [Immutable] Produce | 49,042 | 0.06x (15.6x slower) |

---

## Object Benchmarks

### Object - Single Shallow Update

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Spread | 39,431,929 | 1.00x (baseline) |
| [Immutable] ProduceFast | 17,197,775 | 0.44x (2.3x slower) |
| [Immutable] Produce | 8,433,865 | 0.21x (4.7x slower) |

**ProduceFast vs Produce**: **2.0x faster** ✅

---

### Object - Multiple Shallow Updates

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Spread | 39,451,365 | 1.00x (baseline) |
| [Immutable] ProduceFast | 14,401,544 | 0.37x (2.7x slower) |
| [Immutable] Produce | 6,876,988 | 0.17x (5.7x slower) |

**ProduceFast vs Produce**: **2.1x faster** ✅

---

### Object - Single Deep Update

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Nested Spread | 32,133,474 | 1.00x (baseline) |
| [Immutable] ProduceFast | 6,639,005 | 0.21x (4.8x slower) |
| [Immutable] Produce | 1,913,260 | 0.06x (16.8x slower) |

**ProduceFast vs Produce**: **3.5x faster** ✅

---

### Object - Multiple Deep Updates

| Implementation | ops/sec | vs Native Spread |
|----------------|---------|------------------|
| [Immutable] Native Nested Spread | 27,735,474 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,962,505 | 0.11x (9.4x slower) |
| [Immutable] Produce | 1,021,054 | 0.04x (27.2x slower) |

**ProduceFast vs Produce**: **2.9x faster** ✅

---

## Map Benchmarks

### Map (Small: 100) - Single Set

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 385,418 | 1.00x (baseline) |
| [Immutable] ProduceFast | 368,298 | 0.96x (1.05x slower) |
| [Immutable] Produce | 342,464 | 0.89x (1.13x slower) |

**ProduceFast vs Produce**: 1.08x faster

---

### Map (Small: 100) - Multiple Sets (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 349,141 | 1.00x (baseline) |
| [Immutable] ProduceFast | 309,533 | 0.89x (1.13x slower) |
| [Immutable] Produce | 302,868 | 0.87x (1.15x slower) |

**ProduceFast vs Produce**: 1.02x faster

---

### Map (Medium: 1K) - Single Set

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] ProduceFast | 35,519 | 1.03x faster ✅ |
| [Immutable] Native Copy | 34,571 | 1.00x (baseline) |
| [Immutable] Produce | 2,753 | 0.08x (12.6x slower) |

**ProduceFast vs Produce**: **12.9x faster** 🚀

---

### Map (Medium: 1K) - Delete

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 37,221 | 1.00x (baseline) |
| [Immutable] ProduceFast | 35,026 | 0.94x (1.06x slower) |
| [Immutable] Produce | 2,928 | 0.08x (12.7x slower) |

**ProduceFast vs Produce**: **12.0x faster** 🚀

---

## Set Benchmarks

### Set (Small: 100) - Single Add

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 3,162,859 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,823,514 | 0.89x (1.12x slower) |
| [Immutable] Produce | 2,478,768 | 0.78x (1.28x slower) |

**ProduceFast vs Produce**: 1.14x faster

---

### Set (Small: 100) - Multiple Adds (10)

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 2,580,756 | 1.00x (baseline) |
| [Immutable] ProduceFast | 2,236,432 | 0.87x (1.15x slower) |
| [Immutable] Produce | 1,582,177 | 0.61x (1.63x slower) |

**ProduceFast vs Produce**: 1.41x faster

---

### Set (Medium: 1K) - Single Add

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 355,965 | 1.00x (baseline) |
| [Immutable] ProduceFast | 337,632 | 0.95x (1.05x slower) |
| [Immutable] Produce | 2,916 | 0.01x (122x slower) |

**ProduceFast vs Produce**: **116x faster** 🚀

---

### Set (Medium: 1K) - Delete

| Implementation | ops/sec | vs Native Copy |
|----------------|---------|----------------|
| [Immutable] Native Copy | 370,676 | 1.00x (baseline) |
| [Immutable] ProduceFast | 365,105 | 0.98x (1.02x slower) |
| [Immutable] Produce | 3,371 | 0.01x (110x slower) |

**ProduceFast vs Produce**: **108x faster** 🚀

---

## Read Operations

### Array (Medium: 1K) - Sequential Read

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native | 2,728,435 | 1.00x (baseline) |
| [Read] Pura | 9,749 | **280x slower** ⚠️ |

**Critical finding**: Pura arrays have massive read overhead. Use `.toArray()` for hot loops.

---

### Array (Medium: 1K) - Iterator (for...of)

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native for...of | 2,223,541 | 1.00x (baseline) |
| [Read] Pura for...of | 30,185 | **74x slower** ⚠️ |

---

### Array (Large: 10K) - map()

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native map() | 18,021 | 1.00x (baseline) |
| [Read] Pura map() | 5,254 | **3.4x slower** |

---

### Array (Large: 10K) - filter()

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native filter() | 16,904 | 1.00x (baseline) |
| [Read] Pura filter() | 5,535 | **3.1x slower** |

---

### Array (Large: 10K) - reduce()

| Implementation | ops/sec | Overhead vs Native |
|----------------|---------|-------------------|
| [Read] Native reduce() | 21,064 | 1.00x (baseline) |
| [Read] Pura reduce() | 5,970 | **3.5x slower** |

---

## Summary Statistics

### ProduceFast vs Produce Speedup

| Category | Best Case | Worst Case | Median |
|----------|-----------|------------|--------|
| Objects | 3.5x faster (deep single) | 2.0x faster (shallow single) | 2.5x faster |
| Map (Medium) | 12.9x faster (single set) | 12.0x faster (delete) | 12.5x faster |
| Set (Medium) | 116x faster (single add) | 108x faster (delete) | 112x faster |
| Arrays (Small) | 6.4x faster (multiple) | 1.4x faster (push) | 2.6x faster |

### Pura Direct Mutation vs Native

| Size | Single Update | Degradation |
|------|---------------|-------------|
| Small (100) | 1.00x | None ✅ |
| Medium (1K) | 7.6x slower | Moderate ⚠️ |
| Large (10K) | 8.4x slower | Significant ❌ |

### Pura Read Overhead vs Native

| Operation | Size | Overhead |
|-----------|------|----------|
| Sequential read | 1K | 280x slower ❌ |
| for...of | 1K | 74x slower ❌ |
| map() | 10K | 3.4x slower ⚠️ |
| filter() | 10K | 3.1x slower ⚠️ |
| reduce() | 10K | 3.5x slower ⚠️ |

---

## Conclusions

### ✅ Strengths

1. **ProduceFast dominates medium-large Map/Set** (12-116x faster than Produce)
2. **ProduceFast consistently 2-3.5x faster** than Produce for objects
3. **Pura direct mutation matches native** for small arrays (<100)
4. **Native copy is optimal** for small collections

### ⚠️ Weaknesses

1. **Pura read operations have severe overhead** (3-280x slower)
2. **Pura direct mutation degrades** with size (8x at 10K)
3. **ProduceFast still 2-9x slower** than native spread
4. **Produce collapses on medium-large Map/Set** (12-122x slower)

### 🎯 Recommendations

**Use Native:**
- Small collections (<100)
- Hot loops with reads
- Simple updates

**Use ProduceFast:**
- Medium-large Map/Set (100-10K)
- Complex nested object updates
- Need 2-3x better than Produce

**Use Produce:**
- Ergonomic draft API priority
- Small-medium objects
- Don't need max performance

**Use Pura:**
- Need persistent data structures
- Structural sharing critical
- Minimize write operations
- Convert to array for reads (`.toArray()`)

---

## Raw Data

All raw benchmark outputs are saved in `/tmp/comprehensive-bench-results.txt`

Run benchmarks yourself:
```bash
bun bench benchmarks/comprehensive.bench.ts --run
```
