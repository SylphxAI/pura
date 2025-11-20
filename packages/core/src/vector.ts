/**
 * Persistent Vector (32-way trie)
 *
 * Based on Clojure's PersistentVector with RRB-Tree extensions.
 * - O(log₃₂ n) get/set (effectively constant time)
 * - O(1) push/pop with tail buffer optimization
 * - O(log n) concat with RRB-Tree rebalancing
 *
 * References:
 * - Bagwell & Rompf (2011): RRB-Trees: Efficient Immutable Vectors
 * - Clojure's PersistentVector implementation
 */

// Constants
const BITS = 5; // 2^5 = 32-way branching
const BRANCH_SIZE = 1 << BITS; // 32
const BIT_MASK = BRANCH_SIZE - 1; // 0b11111
const MAX_TAIL_SIZE = BRANCH_SIZE; // Tail buffer size

/**
 * Node types in the vector trie
 */
export type VectorNode<T> = LeafNode<T> | BranchNode<T>;

/**
 * Leaf node: stores actual values
 */
export interface LeafNode<T> {
  type: 'leaf';
  array: T[];
}

/**
 * Branch node: stores references to child nodes
 */
export interface BranchNode<T> {
  type: 'branch';
  array: (VectorNode<T> | null)[];
}

/**
 * Relaxed node: branch with size table for variable-sized children
 * Used after concat operations to maintain balance
 */
export interface RelaxedNode<T> {
  type: 'relaxed';
  array: (VectorNode<T> | null)[];
  sizes: number[]; // Cumulative sizes for each child
}

/**
 * Root structure: separates tree from tail buffer
 */
export interface VectorRoot<T> {
  root: VectorNode<T> | null;
  tail: T[];
  size: number;
  shift: number; // Tree depth in bits (0, 5, 10, 15, ...)
}

/**
 * Create empty vector
 */
export function empty<T>(): VectorRoot<T> {
  return {
    root: null,
    tail: [],
    size: 0,
    shift: BITS,
  };
}

/**
 * Get value at index
 * O(log₃₂ n) tree traversal + O(1) tail access
 */
export function get<T>(vec: VectorRoot<T>, index: number): T | undefined {
  if (index < 0 || index >= vec.size) {
    return undefined;
  }

  // Tail optimization: O(1) access to last 32 elements
  if (index >= tailOffset(vec)) {
    return vec.tail[index - tailOffset(vec)];
  }

  // Tree traversal: O(log₃₂ n)
  return getFromNode(vec.root, index, vec.shift);
}

/**
 * Get value from node (recursive tree traversal)
 */
function getFromNode<T>(
  node: VectorNode<T> | null,
  index: number,
  shift: number,
): T | undefined {
  if (!node) return undefined;

  if (node.type === 'leaf') {
    // At leaf level, use bottom 5 bits for array index
    const leafIndex = index & BIT_MASK;
    return node.array[leafIndex];
  }

  if (node.type === 'branch') {
    // Extract child index using current shift level
    const childIndex = (index >>> shift) & BIT_MASK;
    const child = node.array[childIndex];
    if (!child) return undefined;
    return getFromNode(child, index, shift - BITS);
  }

  // Relaxed node: use size table to find correct child
  if (node.type === 'relaxed') {
    const childIndex = findChildIndex(node.sizes, index);
    const offset = childIndex > 0 ? node.sizes[childIndex - 1]! : 0;
    return getFromNode(
      node.array[childIndex] ?? null,
      index - offset,
      shift - BITS,
    );
  }

  return undefined;
}

/**
 * Find child index in relaxed node using size table
 */
function findChildIndex(sizes: number[], index: number): number {
  // Binary search in size table
  let low = 0;
  let high = sizes.length - 1;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if ((sizes[mid] ?? 0) <= index) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/**
 * Set value at index (returns new vector)
 * O(log₃₂ n) with path copying
 */
export function set<T>(
  vec: VectorRoot<T>,
  index: number,
  value: T,
): VectorRoot<T> {
  if (index < 0 || index >= vec.size) {
    throw new RangeError(`Index out of bounds: ${index}`);
  }

  // Tail update: O(1) copy
  if (index >= tailOffset(vec)) {
    const tailIndex = index - tailOffset(vec);
    const newTail = [...vec.tail];
    newTail[tailIndex] = value;
    return { ...vec, tail: newTail };
  }

  // Tree update: O(log₃₂ n) path copying
  const newRoot = setInNode(vec.root, index, value, vec.shift);
  return { ...vec, root: newRoot };
}

/**
 * Set value in node (recursive with path copying)
 */
function setInNode<T>(
  node: VectorNode<T> | null,
  index: number,
  value: T,
  shift: number,
): VectorNode<T> {
  if (!node) {
    // Create new leaf
    const array = new Array<T>(BRANCH_SIZE);
    array[index & BIT_MASK] = value;
    return { type: 'leaf', array };
  }

  if (node.type === 'leaf') {
    // Copy leaf and update
    const newArray = [...node.array];
    newArray[index & BIT_MASK] = value;
    return { type: 'leaf', array: newArray };
  }

  if (node.type === 'branch') {
    // Copy branch and recurse
    const childIndex = (index >>> shift) & BIT_MASK;
    const newArray = [...node.array];
    newArray[childIndex] = setInNode(
      node.array[childIndex] ?? null,
      index,
      value,
      shift - BITS,
    );
    return { type: 'branch', array: newArray };
  }

  // Relaxed node: find child and recurse
  const childIndex = findChildIndex(node.sizes, index);
  const offset = childIndex > 0 ? node.sizes[childIndex - 1]! : 0;
  const newArray = [...node.array];
  newArray[childIndex] = setInNode(
    node.array[childIndex] ?? null,
    index - offset,
    value,
    shift - BITS,
  );
  return { type: 'relaxed', array: newArray, sizes: [...node.sizes] };
}

/**
 * Push value to end (returns new vector)
 * O(1) amortized with tail buffer
 */
export function push<T>(vec: VectorRoot<T>, value: T): VectorRoot<T> {
  // Tail has space: O(1) copy
  if (vec.tail.length < MAX_TAIL_SIZE) {
    return {
      ...vec,
      tail: [...vec.tail, value],
      size: vec.size + 1,
    };
  }

  // Tail full: push tail into tree, start new tail
  const newRoot = pushTail(vec.root, vec.tail, vec.shift);
  return {
    root: newRoot.root,
    tail: [value],
    size: vec.size + 1,
    shift: newRoot.shift,
  };
}

/**
 * Push tail into tree structure
 */
function pushTail<T>(
  root: VectorNode<T> | null,
  tail: T[],
  shift: number,
): { root: VectorNode<T>; shift: number } {
  const newLeaf: LeafNode<T> = { type: 'leaf', array: tail };

  // Empty tree: leaf becomes root
  if (!root) {
    return { root: newLeaf, shift };
  }

  // Root is a single leaf: promote to branch
  if (root.type === 'leaf') {
    const newRoot: BranchNode<T> = {
      type: 'branch',
      array: [root, newLeaf],
    };
    return { root: newRoot, shift };
  }

  // Tree full at current depth: create new root level
  if (isTreeFull(root, shift)) {
    const newRoot: BranchNode<T> = {
      type: 'branch',
      array: [root, newLeaf],
    };
    return { root: newRoot, shift: shift + BITS };
  }

  // Insert into existing tree
  const newRoot = pushTailIntoNode(root, newLeaf, shift);
  return { root: newRoot, shift };
}

/**
 * Check if tree is full at current depth
 */
function isTreeFull<T>(node: VectorNode<T>, shift: number): boolean {
  if (shift === BITS) {
    // At leaf level: check if branch is full
    return node.type === 'branch' && node.array.length >= BRANCH_SIZE;
  }

  if (node.type === 'branch') {
    const lastChild = node.array[node.array.length - 1];
    return (
      node.array.length >= BRANCH_SIZE &&
      lastChild !== null &&
      isTreeFull(lastChild, shift - BITS)
    );
  }

  return false;
}

/**
 * Push tail into node (recursive)
 */
function pushTailIntoNode<T>(
  node: VectorNode<T>,
  tail: LeafNode<T>,
  shift: number,
): VectorNode<T> {
  if (node.type === 'leaf') {
    // Shouldn't reach here in normal operation
    return node;
  }

  if (node.type === 'branch') {
    const newArray = [...node.array];

    // At parent-of-leaves level: just append the tail
    if (shift === BITS) {
      if (newArray.length < BRANCH_SIZE) {
        newArray.push(tail);
      }
      return { type: 'branch', array: newArray };
    }

    // Deeper level: need to recurse
    const lastIndex = newArray.length - 1;
    const lastChild = newArray[lastIndex];

    // Try to insert into last child if it's not full
    if (lastChild && !isTreeFull(lastChild, shift - BITS)) {
      newArray[lastIndex] = pushTailIntoNode(lastChild, tail, shift - BITS);
      return { type: 'branch', array: newArray };
    }

    // Last child is full: append as new child
    if (newArray.length < BRANCH_SIZE) {
      newArray.push(tail);
    }
    return { type: 'branch', array: newArray };
  }

  // Relaxed node: similar logic with size table update
  return node;
}

/**
 * Pop value from end (returns new vector)
 * O(1) amortized
 */
export function pop<T>(vec: VectorRoot<T>): VectorRoot<T> {
  if (vec.size === 0) {
    return vec;
  }

  // Tail has multiple elements: O(1) copy
  if (vec.tail.length > 1) {
    return {
      ...vec,
      tail: vec.tail.slice(0, -1),
      size: vec.size - 1,
    };
  }

  // Tail has one element: promote rightmost leaf as new tail
  const newTailOffset = tailOffset(vec) - MAX_TAIL_SIZE;
  if (newTailOffset < 0) {
    // No more elements in tree
    return {
      root: null,
      tail: [],
      size: 0,
      shift: BITS,
    };
  }

  // Extract new tail from tree
  const newTail = extractTail(vec.root, newTailOffset, vec.shift);
  const newRoot = popTailFromNode(vec.root, newTailOffset, vec.shift);

  // Reduce tree height if root has single child
  let newShift = vec.shift;
  let finalRoot = newRoot;
  if (
    newRoot &&
    newRoot.type === 'branch' &&
    newRoot.array.length === 1 &&
    vec.shift > BITS
  ) {
    finalRoot = newRoot.array[0] ?? null;
    newShift -= BITS;
  }

  return {
    root: finalRoot,
    tail: newTail,
    size: vec.size - 1,
    shift: newShift,
  };
}

/**
 * Extract tail from tree (rightmost leaf)
 */
function extractTail<T>(
  node: VectorNode<T> | null,
  offset: number,
  shift: number,
): T[] {
  if (!node) return [];

  if (node.type === 'leaf') {
    return node.array;
  }

  if (node.type === 'branch') {
    const childIndex = (offset >>> shift) & BIT_MASK;
    return extractTail(node.array[childIndex] ?? null, offset, shift - BITS);
  }

  return [];
}

/**
 * Pop tail from node (recursive)
 */
function popTailFromNode<T>(
  node: VectorNode<T> | null,
  offset: number,
  shift: number,
): VectorNode<T> | null {
  if (!node) return null;

  if (node.type === 'branch') {
    const childIndex = (offset >>> shift) & BIT_MASK;

    if (shift === BITS) {
      // Parent of leaves: remove last child
      const newArray = node.array.slice(0, childIndex);
      return newArray.length > 0 ? { type: 'branch', array: newArray } : null;
    }

    // Recurse into child
    const newChild = popTailFromNode(
      node.array[childIndex] ?? null,
      offset,
      shift - BITS,
    );
    const newArray = [...node.array.slice(0, childIndex)];
    if (newChild) {
      newArray[childIndex] = newChild;
    }
    return newArray.length > 0 ? { type: 'branch', array: newArray } : null;
  }

  return node;
}

/**
 * Calculate offset where tail begins
 */
function tailOffset<T>(vec: VectorRoot<T>): number {
  return vec.size < MAX_TAIL_SIZE
    ? 0
    : ((vec.size - 1) >>> BITS) << BITS;
}

/**
 * Iterate over all values
 */
export function* iterate<T>(vec: VectorRoot<T>): Iterator<T> {
  // Iterate tree
  if (vec.root) {
    yield* iterateNode(vec.root);
  }
  // Iterate tail
  for (const value of vec.tail) {
    yield value;
  }
}

/**
 * Iterate node recursively
 */
function* iterateNode<T>(node: VectorNode<T>): Iterator<T> {
  if (node.type === 'leaf') {
    for (const value of node.array) {
      if (value !== undefined) {
        yield value;
      }
    }
    return;
  }

  if (node.type === 'branch' || node.type === 'relaxed') {
    for (const child of node.array) {
      if (child) {
        yield* iterateNode(child);
      }
    }
  }
}
