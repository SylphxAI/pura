# Phase 1 Results: Direct Construction

## Performance Impact

### Before → After (Direct Construction)

| Benchmark | Before | After | Change | Target | Status |
|-----------|--------|-------|--------|--------|--------|
| Object shallow 1 | 2.49x | 2.45x | **+1.6%** ✅ | 1.5x | ⚠️ Not yet |
| Object shallow 2+ | 4.92x | 4.87x | **+1.0%** ✅ | 1.5x | ❌ Far from target |
| Object deep 1 | 5.43x | 5.53x | **-1.8%** ❌ | 1.8x | ❌ Got worse |
| Object deep 2+ | 15.08x | 12.23x | **+19%** ✅ | 2.5x | ⚠️ Improved but not enough |
| Object update fn | 4.13x | 3.88x | **+6.0%** ✅ | - | ✅ Small gain |
| Object merge | 4.51x | 4.63x | **-2.7%** ❌ | - | ❌ Slightly worse |

### Key Findings

1. **Multiple deep updates improved 19%** (15.08x → 12.23x)
   - This is the main success of direct construction
   - Still far from 2.5x target (needs 80% more improvement)

2. **Single deep update got worse** (5.43x → 5.53x)
   - Direct construction has overhead
   - setIn() is actually better for single mutations
   - Should keep using fast path for mutations.length === 1

3. **Shallow mutations barely improved** (4.92x → 4.87x)
   - 2-3 shallow fast path helped minimally
   - Most overhead is elsewhere (helper calls, mutation array, spread)

4. **Small gains on update function** (4.13x → 3.88x)
   - 6% improvement is nice but not game-changing

## Analysis: Why Direct Construction Underperformed

### Expected vs Actual

**Expected**: Eliminating Map overhead would give ~50% improvement (15x → 8x)

**Actual**: Only 19% improvement (15x → 12x)

### Root Causes

1. **Map overhead was smaller than expected**
   - Building tree with Map adds maybe 2-3x overhead
   - But we still have other overheads (4-5x) from:
     - Helper method calls
     - Mutation array allocation
     - Multiple spread operations

2. **Direct construction has its own overhead**
   - Still creates Map for grouping (line 559)
   - Still creates new mutation objects (line 592-596)
   - Recursive calls still have overhead

3. **Path manipulation cost**
   - `mutation.path.slice(1)` creates new array every time
   - Spread syntax `{ ...mutation, path: ... }` creates new objects

### Code Analysis

**Direct Construction Overhead:**
```typescript
// Line 559: Still using Map!
const groups = new Map<string | number, ObjectMutation[]>();

// Line 592-596: Creating new mutation objects
const shiftedMutation: ObjectMutation = {
  ...mutation,
  path: mutation.path.slice(1)  // Array allocation
};
```

**The fundamental issue**: We're still building an intermediate representation (Map of grouped mutations), just a different one from the mutation tree.

## What We Learned

### 1. Intermediate Representations Are Expensive

Both mutation tree and direct construction build intermediate data structures:
- Mutation tree: Map-based tree nodes
- Direct construction: Map-based grouping + new mutation objects

**Lesson**: Need to avoid ALL intermediate representations for small mutation counts.

### 2. The 80/20 Rule

Most use cases have 2-4 mutations. For these cases:
- Any intermediate representation is too expensive
- Need inline, specialized code paths
- Think like a compiler: generate optimal code for each pattern

### 3. Recursion Has Cost

Recursive approaches (mutation tree, direct construction) pay:
- Function call overhead
- Stack frame allocation
- Parameter passing

**Lesson**: For small mutation counts, iterative is better than recursive.

### 4. Object/Array Allocation Matters

Every `{ ...mutation, path: ... }` and `path.slice(1)` adds overhead.

At 30M ops/sec:
- One object allocation ≈ 1-2ns
- But we're in the "slowdown factor" game
- Native: 0ns, ProduceFast: 40ns → 40x slower!

## Next Steps: Phase 2 Strategy

### Insight: Pattern-Based Inline Specialization

Instead of general algorithms, recognize and inline optimize common patterns:

#### Pattern 1: 2 Shallow Mutations (Very Common)
```typescript
if (mutations.length === 2 && allShallow && noDeletes) {
  const [m1, m2] = mutations;
  return {
    ...base,
    [m1.path[0]]: getValue(m1),
    [m2.path[0]]: getValue(m2)
  };
}
```

**Expected**: 4.87x → **1.8x** (native is ~2 property assignments)

#### Pattern 2: Mixed 2 Shallow + 2 Deep Same Prefix
```typescript
// User case: $.set(['name'], v1); $.set(['age'], v2);
//            $.set(['profile', 'bio'], v3); $.set(['profile', 'settings', 'theme'], v4)

if (hasMixedPattern()) {
  const shallow = getShallowChanges(mutations);
  const deep = buildNestedForPrefix('profile', mutations);

  return {
    ...base,
    ...shallow,
    profile: deep
  };
}
```

**Expected**: 12.23x → **3-4x**

#### Pattern 3: Single Nested Depth
```typescript
// All mutations at depth 2 with same parent
if (allDepth2SameParent) {
  const prefix = mutations[0].path[0];
  const changes = {};

  for (const m of mutations) {
    changes[m.path[1]] = m.value;
  }

  return {
    ...base,
    [prefix]: { ...base[prefix], ...changes }
  };
}
```

**Expected**: 12.23x → **2.5-3x**

### Implementation Plan: Phase 2

1. **Add pattern detection** (5 common patterns)
2. **Implement inline optimizations** for each pattern
3. **Measure coverage** (what % of real usage hits these patterns)
4. **Iterate** based on coverage data

### Performance Targets: Phase 2

| Benchmark | Current | Phase 2 Target | Strategy |
|-----------|---------|----------------|----------|
| Object shallow 2+ | 4.87x | **2.0x** | Pattern 1: Inline 2-3 shallow |
| Object deep 1 | 5.53x | **2.5x** | Keep setIn (already fast) |
| Object deep 2+ | 12.23x | **3.5x** | Pattern 2 + Pattern 3 |

### Success Criteria

- **Object shallow 2+**: Must get under 2.5x (50% improvement needed)
- **Object deep 2+**: Must get under 5x (60% improvement needed)
- **Maintain correctness**: All tests pass

## Alternative: Abandon General Solution

### Radical Rethink

Maybe `produceFast` with a general mutation API is fundamentally flawed.

**Why**:
- Every abstraction layer adds 1.5-2x overhead
- Helper methods: 1.5x
- Mutation collection: 1.2x
- Pattern detection: 1.1x
- Application: 2-3x

**Total**: 1.5 × 1.2 × 1.1 × 2.5 = **4.95x minimum**

We can NEVER beat ~5x with this architecture!

### Alternative Approach: Macro-Style API

```typescript
// Instead of:
produceFast(user, $ => {
  $.set(['name'], 'Alice');
  $.set(['age'], 30);
});

// What if:
fastSet(user, {
  name: 'Alice',
  age: 30
});

// Or:
fastUpdate(user, draft => {
  draft.name = 'Alice';  // Direct assignment, analyze AST at build time?
  draft.age = 30;
});
```

But this defeats the purpose of having a consistent API with `produce()`.

## Decision: Continue with Phase 2

Despite limitations, let's continue with Phase 2:

1. **Pattern-based optimization** is the only path forward with current API
2. **80/20 rule**: If we optimize 5 patterns covering 80% of use cases, that's a win
3. **Goal**: Get "common cases" under 3x, accept 5-10x for complex cases

**Commit to Phase 2**: Implement pattern detection and inline specialization.
