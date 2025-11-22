# Understanding Adaptive Strategy

Pura's **adaptive strategy** automatically chooses the best representation for your data based on size.

## Overview

```typescript
// Small array (< 512) → Native JavaScript array (zero overhead)
const small = [1, 2, 3]
const result = produceFast(small, $ => $.push(4))
// result is a native array - no persistent structure overhead!

// Large array (>= 512) → RRB-Tree (structural sharing)
const large = Array.from({ length: 1000 }, (_, i) => i)
const result = produceFast(large, $ => $.set(500, 999))
// result uses persistent tree - only ~4 nodes copied!
```

**You don't need to think about this** - it happens automatically!

## Why Adaptive?

### Problem: One Size Doesn't Fit All

Different data sizes have different performance characteristics:

| Size | Best Representation | Why |
|------|-------------------|-----|
| **Small (<512)** | Native array/object | Zero overhead, cache-friendly, simple |
| **Large (>=512)** | Persistent tree | O(log n) updates, structural sharing saves memory |

**Naive approaches fail:**
- Always native → O(n) copies for large data (slow)
- Always tree → overhead for small data (wasteful)

### Solution: Automatic Switching

Pura **measures size** and **chooses automatically**:

```typescript
const items = [1, 2, 3]  // Native

// Add 509 more items → still native
let result = items
for (let i = 4; i <= 512; i++) {
  result = produceFast(result, $ => $.push(i))
}
// result is still native (511 items < 512 threshold)

// Add one more → upgrades to tree
result = produceFast(result, $ => $.push(513))
// result is now RRB-Tree (512 items >= threshold)
```

## Thresholds

### Arrays

**Threshold: 512 elements**

```typescript
// Native: 0-511 elements
const native = Array.from({ length: 511 }, (_, i) => i)
const next = produceFast(native, $ => $.push(999))
// next is native array

// Tree: 512+ elements
const tree = Array.from({ length: 512 }, (_, i) => i)
const next = produceFast(tree, $ => $.set(500, 999))
// next is RRB-Tree proxy
```

**Why 512?**
- RRB-Tree branching factor is 32
- 512 = 16 tail blocks (16 × 32)
- Balances overhead vs benefits
- Empirically tested for best performance

### Maps

**Threshold: 512 entries**

```typescript
// Native: 0-511 entries
const nativeMap = new Map(Array.from({ length: 511 }, (_, i) => [`k${i}`, i]))
const next = produceFast(nativeMap, $ => $.set('new', 999))
// next is native Map

// HAMT: 512+ entries
const hamtMap = new Map(Array.from({ length: 512 }, (_, i) => [`k${i}`, i]))
const next = produceFast(hamtMap, $ => $.set('k500', 999))
// next is HAMT proxy
```

### Sets

**Threshold: 512 elements**

```typescript
// Native: 0-511 elements
const nativeSet = new Set(Array.from({ length: 511 }, (_, i) => i))
const next = produceFast(nativeSet, $ => $.add(999))
// next is native Set

// HAMT: 512+ elements
const hamtSet = new Set(Array.from({ length: 512 }, (_, i) => i))
const next = produceFast(hamtSet, $ => $.add(999))
// next is HAMT proxy
```

### Objects

**Threshold: 512 properties**

```typescript
// Native: 0-511 properties
const obj = Object.fromEntries(Array.from({ length: 511 }, (_, i) => [`k${i}`, i]))
const next = produceFast(obj, $ => $.set(['new'], 999))
// next is native object with shallow copy

// Nested Proxy: 512+ properties
const largeObj = Object.fromEntries(Array.from({ length: 512 }, (_, i) => [`k${i}`, i]))
const next = produceFast(largeObj, $ => $.set(['k500'], 999))
// next uses nested proxy for structural sharing
```

## Promotion (Native → Tree)

When a **small** collection grows **past the threshold**, Pura **promotes** it to a persistent tree:

```typescript
const items = [1, 2, 3]  // Native

// produceFast checks size before and after mutation
const result = produceFast(items, $ => {
  for (let i = 4; i <= 600; i++) {
    $.push(i)
  }
})

// Original: 3 items (native)
// Result: 600 items (>= 512) → promoted to RRB-Tree
```

**Process:**
1. Recipe runs on native array (fast mutations)
2. After recipe, check result size
3. If >= 512, convert to tree
4. Return tree proxy

**Cost:** One-time O(n) conversion (amortized over future updates)

## Demotion (Tree → Native)

When a **large** collection shrinks **below the threshold**, Pura can **demote** it to native:

```typescript
const items = Array.from({ length: 1000 }, (_, i) => i)  // Tree

const result = produceFast(items, $ => {
  // Remove 500 items
  for (let i = 0; i < 500; i++) {
    $.pop()
  }
})

// Original: 1000 items (tree)
// Result: 500 items (< 512) → demoted to native array
```

**When demotion happens:**
- After mutation, check result size
- If < threshold, convert to native
- Return native array/map/set

**Cost:** One-time O(n) conversion (but n is small by definition)

## Performance Impact

### Small Collections (<512)

**Native representation = zero overhead:**

```typescript
const small = [1, 2, 3]
const next = produceFast(small, $ => $.push(4))

// Internally:
// 1. Shallow copy: [1, 2, 3] → [1, 2, 3, 4]
// 2. Return native array
// Performance: Same as manual [...arr, 4]
```

**No tree overhead, no proxy overhead, no bookkeeping!**

### Large Collections (>=512)

**Persistent trees = structural sharing:**

```typescript
const large = Array.from({ length: 10000 }, (_, i) => i)
const next = produceFast(large, $ => $.set(5000, 999))

// Internally:
// 1. RRB-Tree with height 3 (log₃₂(10000) ≈ 2.7)
// 2. Update path: root → level2 → level1 → leaf
// 3. Copy ~4 nodes (32 elements each)
// 4. Reuse 9,968 unchanged elements
// Performance: O(log n) vs O(n) for manual copy
```

**Memory savings:** Only copy changed path, not entire structure.

## Comparison

### Update 1 Element in 10,000-Element Array

| Approach | Representation | Complexity | Memory Copied |
|----------|---------------|-----------|---------------|
| **Manual spread** | Native | O(n) | 10,000 elements |
| **Immer** | Proxy + native | O(n) | 10,000 elements |
| **Pura (adaptive)** | RRB-Tree | O(log n) | ~128 elements (4 nodes × 32) |

**Result:** Pura is **78x less memory** and **faster** for large updates.

### Push 1 Element to 100-Element Array

| Approach | Representation | Complexity | Memory Copied |
|----------|---------------|-----------|---------------|
| **Manual spread** | Native | O(n) | 101 elements |
| **Immer** | Proxy + native | O(n) | 101 elements |
| **Pura (adaptive)** | Native | O(n) | 101 elements |

**Result:** Pura is **same speed** as manual/Immer (all use native).

**Key insight:** Adaptive strategy gives you best of both worlds!

## Crossover Point

Where does tree become faster than native?

```typescript
// Benchmark: Update middle element

// Size 100: Native faster (cache-friendly, simple)
const small = Array(100).fill(0)
produceFast(small, $ => $.set(50, 999))  // ~2μs

// Size 1000: Tree faster (less copying)
const medium = Array(1000).fill(0)
produceFast(medium, $ => $.set(500, 999))  // ~0.5μs (vs ~8μs native)

// Size 10000: Tree much faster
const large = Array(10000).fill(0)
produceFast(large, $ => $.set(5000, 999))  // ~0.5μs (vs ~80μs native)
```

**Crossover:** Around 500-1000 elements (depends on operation).

**Threshold of 512** is chosen conservatively to ensure tree is always beneficial.

## Visibility

### Checking Representation

Use `isPura()` to check if a value is a persistent tree:

```typescript
import { isPura, produceFast } from 'pura'

const small = [1, 2, 3]
const smallResult = produceFast(small, $ => $.push(4))
console.log(isPura(smallResult))  // false (native)

const large = Array(1000).fill(0)
const largeResult = produceFast(large, $ => $.push(1))
console.log(isPura(largeResult))  // true (tree proxy)
```

### Converting to Native

Use `unpura()` to convert tree back to native:

```typescript
import { unpura, produceFast } from 'pura'

const large = Array(1000).fill(0)
const result = produceFast(large, $ => $.push(1))  // Tree

const native = unpura(result)  // Convert to native array
console.log(Array.isArray(native))  // true (native)
console.log(isPura(native))  // false
```

**Use cases for unpura():**
- Serialization (JSON.stringify)
- Third-party libraries expecting native
- Performance-critical hot loops (rare)

See [unpura() Guide](/guide/unpura) for details.

## Manual Control (Rarely Needed)

In rare cases, you might want to **force** a representation:

### Force Native (Small Data)

```typescript
import { unpura } from 'pura'

const tree = produceFast(Array(1000).fill(0), $ => {
  // ... mutations
})

// Force downgrade to native (if you know it's small now)
const native = unpura(tree)
```

### Force Tree (Large Data)

```typescript
import { pura } from 'pura'

const large = Array(10000).fill(0)

// Explicitly wrap in tree (usually unnecessary)
const tree = pura(large)
```

**Note:** `produceFast()` and `produce()` handle this automatically - manual control is rarely needed!

## Best Practices

### ✅ Do: Trust the Strategy

```typescript
// Let Pura decide representation
const result = produceFast(data, $ => {
  // ... mutations
})
// Pura automatically uses native or tree based on size
```

### ✅ Do: Batch Operations

```typescript
// Single produceFast call with multiple mutations
const result = produceFast(items, $ => {
  for (let i = 0; i < 100; i++) {
    $.push(i)
  }
})
// Efficient: checks size once after all mutations
```

### ❌ Don't: Micro-optimize Representation

```typescript
// Don't do this - unnecessary!
const native = unpura(data)  // Force native
const result = produceFast(pura(native), $ => {  // Force tree
  // ...
})
```

**Reason:** Pura's adaptive strategy is already optimized!

### ❌ Don't: Mix Native and Tree Manually

```typescript
// Don't do this - confusing and error-prone!
let data = isPura(data) ? unpura(data) : data  // Force native
data = data.length > 500 ? pura(data) : data   // Maybe tree?
```

**Reason:** `produceFast()` already handles this!

## Advanced: How It Works

### Adaptive Logic (Simplified)

```typescript
function produceFast<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  const baseSize = base.length
  const isBaseTree = isPura(base)

  // Case 1: Small native → Small native (fast path)
  if (!isBaseTree && baseSize < 512) {
    const draft = base.slice()  // Shallow copy
    recipe(makeDraftProxy(draft))

    // Check result size
    if (draft.length >= 512) {
      return convertToTree(draft)  // Promote!
    }
    return draft  // Stay native
  }

  // Case 2: Large tree → mutation with structural sharing
  if (isBaseTree) {
    const tree = getTree(base)
    const newTree = mutateTree(tree, recipe)

    // Check result size
    if (newTree.count < 512) {
      return convertToNative(newTree)  // Demote!
    }
    return makeProxy(newTree)  // Stay tree
  }

  // Case 3: Large native → convert to tree first
  if (!isBaseTree && baseSize >= 512) {
    const tree = convertToTree(base)
    const newTree = mutateTree(tree, recipe)
    // ... (same as case 2)
  }
}
```

**Key:** Size checks happen **before and after** mutations to decide representation.

### Memory Layout

**Native array (< 512):**
```
[1, 2, 3, 4, 5]
└─ Continuous memory block
```

**RRB-Tree (>= 512):**
```
         root
        /    \
     node1  node2
     /  \    /  \
   [0..31][32..63][64..95][96..127]

   + tail: [last 32 elements stored flat]
```

**Structural sharing after update:**
```
Original:     Updated:
  root         root' (new)
  /  \         /  \
 A    B       A'   B (reused!)
             /  \
           [modified] [reused]
```

## Performance Visualization

### Small Collections (Native)

```
Operation: Push to 100-element array

Time: ████ 4μs (native copy)
Pura: ████ 4μs (native copy)

Memory:
Original: ████████████████████ (100 elements)
Result:   ████████████████████ (101 elements)
```

**Both use native → same performance!**

### Large Collections (Tree)

```
Operation: Update middle element in 10,000-element array

Manual: ████████████████████████████████████ 80μs (copy all)
Pura:   █ 0.5μs (update tree path)

Memory copied:
Manual: ████████████████████████████████████ (10,000 elements)
Pura:   ██ (~128 elements in tree path)
```

**Tree is 160x faster for large updates!**

## Summary

### Key Takeaways

1. **Automatic:** Pura chooses native or tree based on size (<512 or >=512)
2. **Zero overhead:** Small collections use native (no tree overhead)
3. **Structural sharing:** Large collections use trees (O(log n) updates)
4. **Transparent:** You don't need to think about it - just use `produceFast()` or `produce()`
5. **Optimal:** Threshold (512) is empirically tuned for best performance

### When to Care

**99% of the time:** Don't think about it - trust the adaptive strategy!

**Rare cases:**
- Serialization → use `unpura()` to convert to native
- Interop with libraries → use `unpura()` if they expect native
- Performance debugging → use `isPura()` to check representation

### Next Steps

- [unpura() Guide](/guide/unpura) - Converting back to native
- [Performance Guide](/guide/performance) - Optimization tips
- [Architecture](/guide/architecture) - Deep dive into RRB-Tree and HAMT
