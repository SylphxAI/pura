# Architecture

Deep dive into Pura's internal data structures and algorithms.

## Overview

Pura uses **persistent data structures** to achieve **O(log n)** immutable updates with **structural sharing**.

### Core Data Structures

1. **RRB-Tree** (Relaxed Radix Balanced Tree) - Arrays
2. **HAMT** (Hash Array Mapped Trie) - Maps and Sets
3. **OrderIndex** - Insertion order tracking for Maps/Sets
4. **Nested Proxies** - Deep object updates

All structures share these properties:
- **Persistent**: Updates create new versions without modifying originals
- **Structural sharing**: Unchanged parts reused across versions
- **O(log n)**: Operations scale logarithmically with size
- **Type-safe**: Perfect TypeScript inference

## RRB-Tree (Arrays)

### What is RRB-Tree?

**Relaxed Radix Balanced Tree** - a persistent vector implementation with:
- **32-way branching** (BITS=5, BRANCH_FACTOR=32)
- **Tail optimization** for efficient push/pop
- **Path copying** for O(log₃₂ n) updates
- **Structural sharing** for memory efficiency

### Tree Structure

```
Vec<T> {
  count: number       // Total elements
  shift: number       // Tree height in bits (0, 5, 10, 15, ...)
  root: Node<T>       // Tree root
  tail: T[]           // Last ≤32 elements (optimization)
  treeCount: number   // Elements in tree (not tail)
}

Node<T> {
  owner?: Owner       // Transient mutation tracking
  children: (Node<T> | T)[]  // 32-way branching
}
```

### Example: 100-Element Array

```
count: 100
shift: 5 (1 level, since 100 < 32²)
treeCount: 64
tail: [64..99]  (36 elements)

root: Node {
  children: [
    [0..31],    // Leaf 0
    [32..63]    // Leaf 1
  ]
}
```

### Example: 10,000-Element Array

```
count: 10,000
shift: 10 (2 levels, since 10,000 < 32³)
treeCount: 9,984
tail: [9984..9999]  (16 elements)

root: Node {
  children: [
    Node {  // Level 1
      children: [
        [0..31], [32..63], ..., [992..1023]     // 32 leaves
      ]
    },
    Node {  // Level 1
      children: [
        [1024..1055], ..., [2016..2047]         // 32 leaves
      ]
    },
    // ... 10 total level-1 nodes (10 × 32 × 32 = 10,240 capacity)
  ]
}
```

### Get Operation

```typescript
function vecGet<T>(vec: Vec<T>, index: number): T | undefined {
  // Case 1: Index in tail (last ≤32 elements)
  if (index >= vec.treeCount) {
    return vec.tail[index - vec.treeCount]
  }

  // Case 2: Index in tree - navigate path
  let node = vec.root
  let shift = vec.shift

  while (shift > 0) {
    // Extract 5-bit chunk for this level
    const idx = (index >>> shift) & MASK  // MASK = 0b11111 (31)
    node = node.children[idx]
    shift -= BITS  // Move down one level
  }

  // Reached leaf - extract element
  return node.children[index & MASK]
}
```

**Complexity:** O(log₃₂ n) = O(log n / 5) ≈ **4 hops** for 1M elements.

### Set Operation

```typescript
function vecSet<T>(vec: Vec<T>, index: number, value: T, owner?: Owner): Vec<T> {
  // Case 1: Index in tail
  if (index >= vec.treeCount) {
    const newTail = tailCopy(vec.tail, owner)
    newTail[index - vec.treeCount] = value
    return { ...vec, tail: newTail, owner }
  }

  // Case 2: Index in tree - copy path
  const newRoot = copyPath(vec.root, vec.shift, index, value, owner)
  return { ...vec, root: newRoot, owner }
}

function copyPath<T>(
  node: Node<T>,
  shift: number,
  index: number,
  value: T,
  owner?: Owner
): Node<T> {
  const idx = (index >>> shift) & MASK
  const newNode = cloneNode(node, owner)

  if (shift === 0) {
    // Leaf level - update element
    newNode.children[idx] = value
  } else {
    // Internal level - recurse down
    newNode.children[idx] = copyPath(
      node.children[idx],
      shift - BITS,
      index,
      value,
      owner
    )
  }

  return newNode
}
```

**Structural Sharing:** Only copy nodes on path from root to target leaf.

**Example:** Update index 5000 in 10,000-element array
- Copy: 1 root + 1 level-1 node + 1 leaf = **3 nodes** (96 elements)
- Reuse: 9,904 elements (99%)

### Push Operation

```typescript
function vecPush<T>(vec: Vec<T>, value: T, owner?: Owner): Vec<T> {
  // Case 1: Tail has space (< 32 elements)
  if (vec.tail.length < BRANCH_FACTOR) {
    const newTail = [...vec.tail, value]
    return { ...vec, count: vec.count + 1, tail: newTail, owner }
  }

  // Case 2: Tail full - flush to tree
  const newRoot = pushTailToTree(vec.root, vec.shift, vec.tail, owner)
  return {
    ...vec,
    count: vec.count + 1,
    root: newRoot,
    tail: [value],  // New tail with single element
    treeCount: vec.treeCount + BRANCH_FACTOR,
    owner
  }
}
```

**Tail Optimization:** Last ≤32 elements stored flat for O(1) push/pop.

**Complexity:** Amortized O(1) for push (occasionally O(log n) when flushing tail).

## HAMT (Maps/Sets)

### What is HAMT?

**Hash Array Mapped Trie** - a persistent map/set implementation with:
- **Bitmap indexing** for space efficiency
- **32-way branching** (5-bit hash chunks)
- **Path copying** for O(log₃₂ n) updates
- **Structural sharing** for memory efficiency

### Tree Structure

```
HNode<K, V> {
  kind: 'node'
  owner?: Owner
  bitmap: number         // 32-bit bitmap (which slots are occupied)
  children: HChild<K, V>[]  // Only allocated slots (space-efficient!)
}

HLeaf<K, V> {
  kind: 'leaf'
  owner?: Owner
  key: K
  value: V
  hash: number
}

HCollision<K, V> {
  kind: 'collision'  // Rare: different keys with same hash
  owner?: Owner
  hash: number
  entries: [K, V][]
}
```

### Bitmap Indexing

**Problem:** 32-way branching = 32 child pointers per node = wasteful for sparse maps!

**Solution:** Use bitmap to track occupied slots, allocate only those children.

```typescript
// Example: Map with 3 entries
// Hash chunks: 00101, 01010, 11111

bitmap: 0b00100000010000000000001000100000
        // ↑       ↑            ↑   ↑
        // 31      21           5   2

children: [
  leaf(key1, hash=00101),   // Slot 2 → index 0
  leaf(key2, hash=01010),   // Slot 5 → index 1
  leaf(key3, hash=10101),   // Slot 21 → index 2
  leaf(key4, hash=11111),   // Slot 31 → index 3
]
```

**Space savings:** 4 children instead of 32 (8× less memory).

### Get Operation

```typescript
function hamtGet<K, V>(node: HNode<K, V>, hash: number, key: K, shift: number): V | undefined {
  // Extract 5-bit chunk at current level
  const chunk = (hash >>> shift) & MASK
  const bit = 1 << chunk

  // Check if slot is occupied
  if ((node.bitmap & bit) === 0) {
    return undefined  // Not found
  }

  // Find index in sparse children array
  const idx = popcount(node.bitmap & (bit - 1))
  const child = node.children[idx]

  if (child.kind === 'leaf') {
    return child.key === key ? child.value : undefined
  } else if (child.kind === 'node') {
    // Recurse down
    return hamtGet(child, hash, key, shift + BITS)
  } else {
    // Collision - linear search
    for (const [k, v] of child.entries) {
      if (k === key) return v
    }
    return undefined
  }
}
```

**popcount:** Count 1-bits in bitmap to find sparse index.

**Example:** `popcount(0b00100000010000000000001000100000 & 0b00011111) = 2`
- Bitmap has 1-bits at positions 2, 5, 21, 31
- Mask `0b00011111` includes positions 0-4
- Count 1-bits in masked result = 1 (position 2)
- Sparse index = 1

### Popcount Table

Pura uses a **65,536-entry lookup table** for fast popcount:

```typescript
const popcountTable = new Uint8Array(65536)

// Precompute popcount for all 16-bit values
for (let i = 0; i < 65536; i++) {
  popcountTable[i] = countBits(i)
}

function popcount(n: number): number {
  // Split 32-bit into two 16-bit chunks
  return popcountTable[n & 0xffff] + popcountTable[n >>> 16]
}
```

**Complexity:** O(1) popcount vs O(log n) for iterative bit counting.

### Set Operation

```typescript
function hamtSet<K, V>(
  node: HNode<K, V>,
  hash: number,
  key: K,
  value: V,
  shift: number,
  owner?: Owner
): HNode<K, V> {
  const chunk = (hash >>> shift) & MASK
  const bit = 1 << chunk
  const idx = popcount(node.bitmap & (bit - 1))

  // Case 1: Slot empty - insert new leaf
  if ((node.bitmap & bit) === 0) {
    const newChildren = [
      ...node.children.slice(0, idx),
      { kind: 'leaf', key, value, hash, owner },
      ...node.children.slice(idx)
    ]
    return {
      kind: 'node',
      owner,
      bitmap: node.bitmap | bit,  // Set bit
      children: newChildren
    }
  }

  // Case 2: Slot occupied - update or recurse
  const child = node.children[idx]

  if (child.kind === 'leaf') {
    if (child.key === key) {
      // Update existing
      const newChildren = [...node.children]
      newChildren[idx] = { ...child, value, owner }
      return { ...node, children: newChildren, owner }
    } else {
      // Hash collision - create node or collision
      // ... (omitted for brevity)
    }
  } else {
    // Recurse down
    const newChild = hamtSet(child, hash, key, value, shift + BITS, owner)
    const newChildren = [...node.children]
    newChildren[idx] = newChild
    return { ...node, children: newChildren, owner }
  }
}
```

**Structural Sharing:** Only copy nodes on path from root to target.

### Hashing

Pura uses **MurmurHash3** for string keys and **identity hash** for non-strings:

```typescript
function hash(key: unknown): number {
  if (typeof key === 'string') {
    return murmur3(key)  // Fast string hashing
  } else {
    return identityHash(key)  // Object identity
  }
}

function murmur3(key: string, seed = 0): number {
  let h = seed
  for (let i = 0; i < key.length; i++) {
    const k = key.charCodeAt(i)
    h ^= k
    h = Math.imul(h, 0xcc9e2d51)
    h = (h << 15) | (h >>> 17)
    h = Math.imul(h, 0x1b873593)
  }
  h ^= key.length
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0  // Unsigned 32-bit
}
```

**Complexity:** O(k) where k is key length.

## OrderIndex (Insertion Order)

### Problem

Maps and Sets need to maintain **insertion order** for iteration, but HAMT stores by **hash order**.

### Solution: Dual Data Structures

```typescript
OrderIndex<K, V> {
  next: number                 // Next available index
  keyToIdx: HMap<K, number>    // Key → index lookup (O(log n))
  idxToKey: Vec<K | DELETED>   // Index → key (ordered iteration)
  idxToVal?: Vec<V | DELETED>  // Index → value (for Maps)
  holes: number                // Count of deleted entries
}
```

**Strategy:**
- **Insertion:** Append to `idxToKey` (preserves order), store index in `keyToIdx`
- **Lookup:** `keyToIdx` gives index, `idxToVal` gives value (O(log n))
- **Iteration:** Iterate `idxToKey` (preserves insertion order)
- **Deletion:** Mark as `DELETED` in vectors, increment `holes`

### Example: Map with Insertions

```typescript
const map = new Map()
map.set('a', 1)  // Index 0
map.set('b', 2)  // Index 1
map.set('c', 3)  // Index 2

// OrderIndex:
{
  next: 3,
  keyToIdx: HAMT { 'a' → 0, 'b' → 1, 'c' → 2 },
  idxToKey: Vec ['a', 'b', 'c'],
  idxToVal: Vec [1, 2, 3],
  holes: 0
}

// Iteration order: a, b, c (insertion order preserved!)
```

### Example: Map with Deletion

```typescript
map.delete('b')

// OrderIndex:
{
  next: 3,
  keyToIdx: HAMT { 'a' → 0, 'c' → 2 },  // 'b' removed
  idxToKey: Vec ['a', DELETED, 'c'],    // 'b' marked deleted
  idxToVal: Vec [1, DELETED, 3],
  holes: 1
}

// Iteration order: a, c (skips DELETED)
```

### Compaction

When `holes > 50%` and `size > 32`, compact to reclaim space:

```typescript
function orderCompact<K, V>(ord: OrderIndex<K, V>, owner?: Owner): OrderIndex<K, V> {
  const newIdxToKey: K[] = []
  const newIdxToVal: V[] = []
  const newKeyToIdx = hamtEmpty<K, number>()

  // Rebuild without holes
  for (let i = 0; i < ord.next; i++) {
    const key = vecGet(ord.idxToKey, i)
    if (key !== DELETED) {
      const newIdx = newIdxToKey.length
      newIdxToKey.push(key)
      newIdxToVal.push(vecGet(ord.idxToVal, i))
      newKeyToIdx = hamtSet(newKeyToIdx, hash(key), key, newIdx, 0, owner)
    }
  }

  return {
    next: newIdxToKey.length,
    keyToIdx: newKeyToIdx,
    idxToKey: vecFromArray(newIdxToKey, owner),
    idxToVal: vecFromArray(newIdxToVal, owner),
    holes: 0
  }
}
```

**Complexity:** O(n) but amortized over many deletions.

## Nested Proxies (Objects)

### Copy-on-Write for Deep Updates

Pura uses **nested proxy handlers** to track and copy changed paths:

```typescript
const state = {
  user: {
    profile: {
      settings: {
        theme: 'light'
      }
    }
  }
}

const next = produce(state, draft => {
  draft.user.profile.settings.theme = 'dark'
})

// Internally:
// - Proxy traps 'user' access → mark 'user' as accessed
// - Proxy traps 'profile' access → mark 'profile' as accessed
// - Proxy traps 'settings' access → mark 'settings' as accessed
// - Proxy traps 'theme' set → mark 'settings' as modified
// - On commit: copy path 'user' → 'profile' → 'settings', reuse rest
```

**Structural Sharing:**
```typescript
console.log(state.user.profile.settings === next.user.profile.settings)  // false (copied)
console.log(state.user.profile === next.user.profile)  // false (copied)
console.log(state.user === next.user)  // false (copied)
console.log(state === next)  // false (copied)

// But if state had other properties:
const state = { user: {...}, metadata: {...} }
const next = produce(state, draft => {
  draft.user.profile.settings.theme = 'dark'
})
console.log(state.metadata === next.metadata)  // true (reused!)
```

## Transient Updates

### Problem

Batch updates create intermediate versions:

```typescript
let arr = [1, 2, 3]
arr = vecSet(arr, 0, 10)  // Version 1
arr = vecSet(arr, 1, 20)  // Version 2 (copies path again!)
arr = vecSet(arr, 2, 30)  // Version 3 (copies path again!)
```

**Inefficient:** Each update copies path, even though intermediate versions are discarded.

### Solution: Owner-Based Structural Sharing

```typescript
interface Owner {
  id: symbol  // Unique identifier for transaction
}

const owner: Owner = { id: Symbol() }

let arr = [1, 2, 3]
arr = vecSet(arr, 0, 10, owner)  // Mutate in-place (owner matches)
arr = vecSet(arr, 1, 20, owner)  // Mutate in-place (owner matches)
arr = vecSet(arr, 2, 30, owner)  // Mutate in-place (owner matches)
```

**Optimization:** Nodes with matching `owner` can be mutated in-place instead of copied.

**Safety:** Owner is unique to transaction - no cross-contamination.

### Implementation

```typescript
function cloneNode<T>(node: Node<T>, owner?: Owner): Node<T> {
  // Reuse node if owner matches (transient mutation)
  if (owner && node.owner === owner) {
    return node  // Mutate in-place!
  }

  // Otherwise, copy node
  return {
    owner,
    children: node.children.slice()  // Shallow copy
  }
}
```

**Impact:** 10-100× faster for batch updates.

## Adaptive Strategy

### Size-Based Representation

Pura automatically chooses representation based on size:

```typescript
// Small array (< 512)
const small = [1, 2, 3]
const next = produceFast(small, $ => $.push(4))
// next is native array (no tree overhead!)

// Large array (>= 512)
const large = Array(1000).fill(0)
const next = produceFast(large, $ => $.push(1))
// next is RRB-Tree proxy (structural sharing!)
```

**Threshold:** 512 elements (empirically tuned).

**Why 512?**
- RRB-Tree branching factor: 32
- 512 = 16 tail blocks (efficient for push/pop)
- Crossover point where tree becomes faster than native

### Promotion (Native → Tree)

```typescript
function produceArray<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  if (base.length < 512) {
    const draft = base.slice()  // Native copy
    recipe(makeDraftProxy(draft))

    // Check result size
    if (draft.length >= 512) {
      return convertToTree(draft)  // Promote!
    }
    return draft
  }

  // Already tree or large native → use tree
  // ...
}
```

### Demotion (Tree → Native)

```typescript
function produceArray<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  if (isTree(base)) {
    const tree = mutateTree(base, recipe)

    // Check result size
    if (tree.count < 512) {
      return convertToNative(tree)  // Demote!
    }
    return makeProxy(tree)
  }

  // ...
}
```

**Impact:** Zero overhead for small collections, O(log n) for large.

## Performance Characteristics

### Time Complexity

| Operation | Native | RRB-Tree | HAMT |
|-----------|--------|----------|------|
| **Get** | O(1) | O(log₃₂ n) ≈ O(1) | O(log₃₂ n) ≈ O(1) |
| **Set** | O(n) | O(log₃₂ n) ≈ O(1) | O(log₃₂ n) ≈ O(1) |
| **Push** | O(n) | O(1) amortized | N/A |
| **Pop** | O(n) | O(1) amortized | N/A |
| **Iteration** | O(n) | O(n) | O(n) |

**Note:** O(log₃₂ n) ≈ O(1) for practical sizes (log₃₂(1M) ≈ 4).

### Space Complexity

| Operation | Native | RRB-Tree | HAMT |
|-----------|--------|----------|------|
| **Full copy** | O(n) | O(log₃₂ n) | O(log₃₂ n) |
| **Structural sharing** | 0% | ~99% for single update | ~99% for single update |

**Example:** Update 1 element in 10,000-element array
- Native: Copy 10,000 elements (40KB)
- RRB-Tree: Copy ~128 elements (0.5KB)
- **Savings:** 99% less memory

## Summary

### Key Takeaways

1. **RRB-Tree**: 32-way tree with tail optimization for efficient arrays
2. **HAMT**: Bitmap-indexed 32-way trie for efficient maps/sets
3. **OrderIndex**: Dual data structures for insertion order + O(log n) lookup
4. **Nested Proxies**: Copy-on-write for deep object updates
5. **Transient Updates**: Owner-based optimization for batch mutations
6. **Adaptive Strategy**: Automatic native (<512) vs tree (>=512) selection

### Complexity Summary

| Data Structure | Get | Set | Insert | Delete | Space |
|---------------|-----|-----|--------|--------|-------|
| **RRB-Tree** | O(log n) | O(log n) | O(log n) | O(log n) | O(log n) overhead |
| **HAMT** | O(log n) | O(log n) | O(log n) | O(log n) | O(log n) overhead |
| **OrderIndex** | O(log n) | O(log n) | O(log n) | O(1)* | O(n) + O(log n) |

*Deletion marks as `DELETED`, compaction is O(n) amortized.

### Next Steps

- [Understanding Adaptive Strategy](/guide/understanding-adaptive) - How native vs tree is chosen
- [Performance Guide](/guide/performance) - Optimization tips
- [Source Code](https://github.com/sylphxltd/pura/tree/main/packages/core/src/internal) - Implementation details
