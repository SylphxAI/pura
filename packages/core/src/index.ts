/**
 * Pura - High-performance persistent vector with dual modes
 *
 * Two modes:
 * 1. Mutable: const arr = pura([1,2,3]); arr.push(4) // direct mutation
 * 2. Immutable: const b = produce(arr, draft => draft.push(4)) // structural sharing
 *
 * Uses bit-partitioned vector trie (like Clojure) for O(log₃₂ n) operations
 * Type is always T[] (Proxy-based)
 */

// ===== Tree Configuration =====
const BITS = 5;
const BRANCH_FACTOR = 1 << BITS;  // 32
const MASK = BRANCH_FACTOR - 1;   // 0x1F

// ===== Internal tracking =====
const TREE_STATE = new WeakMap<any[], TreeState<any>>();
const PROXY_STATE_REF = new WeakMap<any[], { current: TreeState<any> }>();

interface TreeState<T> {
  root: TreeNode<T>;
  length: number;
  shift: number;  // Current tree depth in bits (0 = leaf only, 5 = 1 level, 10 = 2 levels, etc.)
  tail: T[];      // Tail optimization: last chunk stored separately for fast push
}

interface TreeNode<T> {
  children: (TreeNode<T> | T[] | undefined)[];
}

// ===== Bit-partitioned Vector Trie Operations =====

function newPath<T>(level: number, node: TreeNode<T> | T[]): TreeNode<T> {
  if (level === 0) {
    return { children: [node] };
  }
  return { children: [newPath(level - BITS, node)] };
}

function pushTail<T>(level: number, parent: TreeNode<T>, tailNode: T[], length: number): TreeNode<T> {
  const subidx = ((length - 1) >>> level) & MASK;
  const newChildren = parent.children.slice();

  if (level === BITS) {
    // At bottom level, insert tail directly
    newChildren[subidx] = tailNode;
  } else {
    const child = parent.children[subidx] as TreeNode<T> | undefined;
    if (child) {
      newChildren[subidx] = pushTail(level - BITS, child, tailNode, length);
    } else {
      newChildren[subidx] = newPath(level - BITS, tailNode);
    }
  }

  return { children: newChildren };
}

function getNode<T>(state: TreeState<T>, index: number): T {
  // Check tail first (optimization for recent elements)
  const tailOffset = state.length - state.tail.length;
  if (index >= tailOffset) {
    return state.tail[index - tailOffset]!;
  }

  // Navigate tree using bit-partition
  let node: TreeNode<T> | T[] = state.root;
  for (let level = state.shift; level > 0; level -= BITS) {
    node = (node as TreeNode<T>).children[(index >>> level) & MASK]!;
  }
  return (node as T[])[(index & MASK)]!;
}

function setNode<T>(state: TreeState<T>, index: number, value: T): TreeState<T> {
  const tailOffset = state.length - state.tail.length;

  // Update in tail
  if (index >= tailOffset) {
    const newTail = state.tail.slice();
    newTail[index - tailOffset] = value;
    return { ...state, tail: newTail };
  }

  // Update in tree - path copying for structural sharing
  const newRoot = setInTree(state.root, state.shift, index, value);
  return { ...state, root: newRoot };
}

function setInTree<T>(node: TreeNode<T>, level: number, index: number, value: T): TreeNode<T> {
  const newChildren = node.children.slice();
  const subidx = (index >>> level) & MASK;

  if (level === BITS) {
    // One level above leaf - children are leaf arrays (T[])
    const arr = (node.children[subidx] as T[]).slice();
    arr[index & MASK] = value;
    newChildren[subidx] = arr;
  } else {
    // Recurse deeper
    newChildren[subidx] = setInTree(node.children[subidx] as TreeNode<T>, level - BITS, index, value);
  }

  return { children: newChildren };
}

function pushValue<T>(state: TreeState<T>, value: T): TreeState<T> {
  // Room in tail?
  if (state.tail.length < BRANCH_FACTOR) {
    const newTail = state.tail.slice();
    newTail.push(value);
    return { ...state, length: state.length + 1, tail: newTail };
  }

  // Tail is full, need to push it into tree
  const tailNode = state.tail;
  let newRoot = state.root;
  let newShift = state.shift;

  // Tree overflow? Need new root level
  if ((state.length >>> BITS) > (1 << state.shift)) {
    newRoot = { children: [state.root, newPath(state.shift, tailNode)] };
    newShift = state.shift + BITS;
  } else {
    newRoot = pushTail(state.shift, state.root, tailNode, state.length);
  }

  return {
    root: newRoot,
    length: state.length + 1,
    shift: newShift,
    tail: [value]
  };
}

function popValue<T>(state: TreeState<T>): { value: T; newState: TreeState<T> } | undefined {
  if (state.length === 0) return undefined;

  const value = state.tail.length > 0
    ? state.tail[state.tail.length - 1]!
    : getNode(state, state.length - 1);

  if (state.tail.length > 1) {
    // Just pop from tail
    return {
      value,
      newState: { ...state, length: state.length - 1, tail: state.tail.slice(0, -1) }
    };
  }

  if (state.length === 1) {
    // Becoming empty
    return {
      value,
      newState: { root: { children: [] }, length: 0, shift: 0, tail: [] }
    };
  }

  // Need to pull new tail from tree
  const newTailOffset = state.length - BRANCH_FACTOR - 1;
  const newTail = getLeafArray(state, newTailOffset);
  const newRoot = popTail(state.shift, state.root, state.length - 1);

  // Check if we can reduce tree height
  let finalRoot = newRoot;
  let finalShift = state.shift;
  if (state.shift > 0 && newRoot.children.length === 1) {
    finalRoot = newRoot.children[0] as TreeNode<T>;
    finalShift = state.shift - BITS;
  }

  return {
    value,
    newState: { root: finalRoot, length: state.length - 1, shift: finalShift, tail: newTail }
  };
}

function getLeafArray<T>(state: TreeState<T>, index: number): T[] {
  let node: TreeNode<T> | T[] = state.root;
  for (let level = state.shift; level > 0; level -= BITS) {
    node = (node as TreeNode<T>).children[(index >>> level) & MASK]!;
  }
  return (node as T[]).slice();
}

function popTail<T>(level: number, node: TreeNode<T>, length: number): TreeNode<T> {
  const subidx = ((length - 1) >>> level) & MASK;

  if (level > BITS) {
    const newChild = popTail(level - BITS, node.children[subidx] as TreeNode<T>, length);
    if (newChild.children.length === 0 && subidx === 0) {
      return { children: [] };
    }
    const newChildren = node.children.slice();
    newChildren[subidx] = newChild;
    return { children: newChildren };
  }

  // At bottom level
  if (subidx === 0) {
    return { children: [] };
  }
  return { children: node.children.slice(0, subidx) };
}

// ===== Create state from array =====
function createStateFromArray<T>(items: T[]): TreeState<T> {
  if (items.length === 0) {
    return { root: { children: [] }, length: 0, shift: 0, tail: [] };
  }

  if (items.length <= BRANCH_FACTOR) {
    // Small array - just use tail
    return { root: { children: [] }, length: items.length, shift: 0, tail: items.slice() };
  }

  // Build tree from chunks
  const tailStart = items.length - ((items.length - 1) % BRANCH_FACTOR) - 1;
  const tail = items.slice(tailStart);

  // Build leaf nodes
  const leaves: T[][] = [];
  for (let i = 0; i < tailStart; i += BRANCH_FACTOR) {
    leaves.push(items.slice(i, Math.min(i + BRANCH_FACTOR, tailStart)));
  }

  if (leaves.length === 0) {
    return { root: { children: [] }, length: items.length, shift: 0, tail };
  }

  // Build tree bottom-up
  let nodes: (TreeNode<T> | T[])[] = leaves;
  let shift = 0;

  while (nodes.length > 1) {
    shift += BITS;
    const newNodes: TreeNode<T>[] = [];
    for (let i = 0; i < nodes.length; i += BRANCH_FACTOR) {
      newNodes.push({ children: nodes.slice(i, Math.min(i + BRANCH_FACTOR, nodes.length)) });
    }
    nodes = newNodes;
  }

  return { root: nodes[0] as TreeNode<T>, length: items.length, shift, tail };
}

// ===== Convert state to array =====
function stateToArray<T>(state: TreeState<T>): T[] {
  if (state.length === 0) return [];

  const result = new Array<T>(state.length);
  const tailOffset = state.length - state.tail.length;

  // Fill from tree
  fillFromNode(state.root, state.shift, 0, result, tailOffset);

  // Fill from tail
  for (let i = 0; i < state.tail.length; i++) {
    result[tailOffset + i] = state.tail[i]!;
  }

  return result;
}

function fillFromNode<T>(node: TreeNode<T> | T[], level: number, offset: number, result: T[], maxIndex: number): void {
  if (level === 0) {
    // Leaf array
    const arr = node as T[];
    for (let i = 0; i < arr.length && offset + i < maxIndex; i++) {
      result[offset + i] = arr[i]!;
    }
    return;
  }

  const treeNode = node as TreeNode<T>;
  let childOffset = offset;
  const childSize = 1 << level;

  for (let i = 0; i < treeNode.children.length; i++) {
    const child = treeNode.children[i];
    if (child && childOffset < maxIndex) {
      fillFromNode(child as TreeNode<T> | T[], level - BITS, childOffset, result, maxIndex);
    }
    childOffset += childSize;
  }
}

// ===== Create proxy from state =====
function createProxyFromState<T>(state: TreeState<T>): T[] {
  // Wrap state in object so proxy can mutate it
  const stateRef = { current: state };

  const proxy = new Proxy([] as T[], {
    get(_, prop) {
      const s = stateRef.current;

      // Numeric index
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index) && index >= 0 && index < s.length) {
          return getNode(s, index);
        }
      }

      if (prop === 'length') return s.length;

      // Mutable operations
      if (prop === 'push') {
        return (...items: T[]) => {
          for (const item of items) {
            stateRef.current = pushValue(stateRef.current, item);
          }
          return stateRef.current.length;
        };
      }

      if (prop === 'pop') {
        return () => {
          const result = popValue(stateRef.current);
          if (!result) return undefined;
          stateRef.current = result.newState;
          return result.value;
        };
      }

      // Array methods - use tail fast path when possible
      if (prop === 'map') {
        return <U>(fn: (item: T, index: number) => U): U[] => {
          const result: U[] = new Array(s.length);
          for (let i = 0; i < s.length; i++) {
            result[i] = fn(getNode(s, i), i);
          }
          return result;
        };
      }

      if (prop === 'filter') {
        return (fn: (item: T, index: number) => boolean): T[] => {
          const result: T[] = [];
          for (let i = 0; i < s.length; i++) {
            const item = getNode(s, i);
            if (fn(item, i)) result.push(item);
          }
          return result;
        };
      }

      if (prop === 'forEach') {
        return (fn: (item: T, index: number) => void): void => {
          for (let i = 0; i < s.length; i++) {
            fn(getNode(s, i), i);
          }
        };
      }

      if (prop === 'reduce') {
        return <U>(fn: (acc: U, item: T, index: number) => U, initialValue: U): U => {
          let acc = initialValue;
          for (let i = 0; i < s.length; i++) {
            acc = fn(acc, getNode(s, i), i);
          }
          return acc;
        };
      }

      if (prop === 'find') {
        return (fn: (item: T, index: number) => boolean): T | undefined => {
          for (let i = 0; i < s.length; i++) {
            const item = getNode(s, i);
            if (fn(item, i)) return item;
          }
          return undefined;
        };
      }

      if (prop === 'findIndex') {
        return (fn: (item: T, index: number) => boolean): number => {
          for (let i = 0; i < s.length; i++) {
            if (fn(getNode(s, i), i)) return i;
          }
          return -1;
        };
      }

      if (prop === 'includes') {
        return (searchElement: T): boolean => {
          for (let i = 0; i < s.length; i++) {
            if (getNode(s, i) === searchElement) return true;
          }
          return false;
        };
      }

      if (prop === 'indexOf') {
        return (searchElement: T): number => {
          for (let i = 0; i < s.length; i++) {
            if (getNode(s, i) === searchElement) return i;
          }
          return -1;
        };
      }

      if (prop === 'slice') {
        return (start?: number, end?: number): T[] => {
          return stateToArray(s).slice(start, end);
        };
      }

      if (prop === 'concat') {
        return (...items: any[]): T[] => {
          return stateToArray(s).concat(...items);
        };
      }

      if (prop === 'join') {
        return (separator?: string): string => {
          return stateToArray(s).join(separator);
        };
      }

      if (prop === 'some') {
        return (fn: (item: T, index: number) => boolean): boolean => {
          for (let i = 0; i < s.length; i++) {
            if (fn(getNode(s, i), i)) return true;
          }
          return false;
        };
      }

      if (prop === 'every') {
        return (fn: (item: T, index: number) => boolean): boolean => {
          for (let i = 0; i < s.length; i++) {
            if (!fn(getNode(s, i), i)) return false;
          }
          return true;
        };
      }

      // Iterator
      if (prop === Symbol.iterator) {
        return function* () {
          for (let i = 0; i < s.length; i++) {
            yield getNode(s, i);
          }
        };
      }

      if (prop === 'toString' || prop === 'toLocaleString') {
        return () => stateToArray(s).toString();
      }

      if (prop === Symbol.toStringTag) {
        return 'Array';
      }

      if (prop === 'inspect' || (typeof Symbol !== 'undefined' && prop === Symbol.for('nodejs.util.inspect.custom'))) {
        return () => stateToArray(s);
      }

      return undefined;
    },

    set(_, prop, value) {
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index) && index >= 0) {
          if (index < stateRef.current.length) {
            stateRef.current = setNode(stateRef.current, index, value);
            return true;
          }
          if (index === stateRef.current.length) {
            stateRef.current = pushValue(stateRef.current, value);
            return true;
          }
        }
      }

      // Handle length assignment
      if (prop === 'length') {
        const newLen = Number(value);
        if (!Number.isNaN(newLen) && newLen >= 0) {
          while (stateRef.current.length > newLen) {
            const result = popValue(stateRef.current);
            if (!result) break;
            stateRef.current = result.newState;
          }
          return true;
        }
      }

      return false;
    },

    has(_, prop) {
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index)) {
          return index >= 0 && index < stateRef.current.length;
        }
      }
      return prop === 'length';
    },

    ownKeys(target) {
      const keys: (string | symbol)[] = [];
      for (let i = 0; i < stateRef.current.length; i++) {
        keys.push(String(i));
      }
      keys.push('length');
      const targetSymbols = Object.getOwnPropertySymbols(target);
      for (const sym of targetSymbols) {
        keys.push(sym);
      }
      return keys;
    },

    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'length') {
        return { value: stateRef.current.length, writable: true, enumerable: false, configurable: false };
      }
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index) && index >= 0 && index < stateRef.current.length) {
          return { value: getNode(stateRef.current, index), writable: true, enumerable: true, configurable: true };
        }
      }
      const targetDesc = Object.getOwnPropertyDescriptor(target, prop);
      if (targetDesc) return targetDesc;
      return undefined;
    }
  });

  // Store reference to stateRef so we can get current state
  PROXY_STATE_REF.set(proxy, stateRef);

  return proxy;
}

// ===== Check if array is efficient =====
function isEfficient<T>(arr: T[]): boolean {
  return PROXY_STATE_REF.has(arr);
}

function getState<T>(arr: T[]): TreeState<T> | undefined {
  const ref = PROXY_STATE_REF.get(arr);
  return ref?.current;
}

// ===== Draft for produce =====
class Draft<T> {
  private modifications: Map<number, T> = new Map();
  private appends: T[] = [];
  private removed: Set<number> = new Set();
  private _length: number;

  constructor(
    private state: TreeState<T>,
    private readonly base: T[]
  ) {
    this._length = state.length;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._length) return undefined;
    if (this.removed.has(index)) return undefined;

    if (this.modifications.has(index)) {
      return this.modifications.get(index);
    }

    const originalLength = this.state.length;
    if (index >= originalLength) {
      return this.appends[index - originalLength];
    }

    return getNode(this.state, index);
  }

  set(index: number, value: T): void {
    if (index < 0) return;

    if (index < this.state.length) {
      this.modifications.set(index, value);
      this.removed.delete(index);
    } else if (index < this._length) {
      this.appends[index - this.state.length] = value;
    } else if (index === this._length) {
      this.appends.push(value);
      this._length++;
    }
  }

  push(...items: T[]): number {
    this.appends.push(...items);
    this._length += items.length;
    return this._length;
  }

  pop(): T | undefined {
    if (this._length === 0) return undefined;

    // Pop from appends first
    if (this.appends.length > 0) {
      this._length--;
      return this.appends.pop();
    }

    // Pop from state - find last non-removed index
    for (let i = this.state.length - 1; i >= 0; i--) {
      if (!this.removed.has(i)) {
        const value = getNode(this.state, i);
        this.removed.add(i);
        this._length--;
        return value;
      }
    }

    return undefined;
  }

  get length(): number {
    return this._length;
  }

  set length(newLen: number) {
    while (this._length > newLen) {
      this.pop();
    }
  }

  finalize(): T[] {
    // Reference identity - no changes
    if (this.modifications.size === 0 && this.appends.length === 0 && this.removed.size === 0) {
      return this.base;
    }

    // Apply modifications with structural sharing
    let newState = this.state;
    for (const [index, value] of this.modifications) {
      newState = setNode(newState, index, value);
    }

    // Apply appends
    for (const item of this.appends) {
      newState = pushValue(newState, item);
    }

    // Apply removals (only tail pops supported efficiently)
    const removedSorted = Array.from(this.removed).sort((a, b) => b - a);
    for (const index of removedSorted) {
      if (index === newState.length - 1) {
        const result = popValue(newState);
        if (result) newState = result.newState;
      }
    }

    // Create new proxy from state - TRUE STRUCTURAL SHARING!
    return createProxyFromState(newState);
  }
}

// ===== PUBLIC API: pura() =====
export function pura<T>(items: T[]): T[] {
  if (isEfficient(items)) return items;
  const state = createStateFromArray([...items]);
  return createProxyFromState(state);
}

// ===== PUBLIC API: unpura() =====
export function unpura<T>(items: T[]): T[] {
  if (!isEfficient(items)) return items;
  const state = getState(items)!;
  return stateToArray(state);
}

// ===== PUBLIC API: produce() =====
export function produce<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  // Convert native array to efficient array if needed
  let state: TreeState<T>;
  if (!isEfficient(base)) {
    state = createStateFromArray([...base]);
    base = createProxyFromState(state);
  } else {
    state = getState(base)!;
  }

  const draftObj = new Draft(state, base);

  const proxy = new Proxy([] as T[], {
    get(_, prop) {
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index)) {
          return draftObj.get(index);
        }
      }

      if (prop === 'length') return draftObj.length;
      if (prop === 'push') return (...items: T[]) => draftObj.push(...items);
      if (prop === 'pop') return () => draftObj.pop();

      // Iterator support
      if (prop === Symbol.iterator) {
        return function* () {
          for (let i = 0; i < draftObj.length; i++) {
            yield draftObj.get(i);
          }
        };
      }

      if (prop === 'map') {
        return <U>(fn: (item: T, index: number) => U) => {
          const result: U[] = [];
          for (let i = 0; i < draftObj.length; i++) {
            result.push(fn(draftObj.get(i)!, i));
          }
          return result;
        };
      }

      if (prop === 'filter') {
        return (fn: (item: T, index: number) => boolean) => {
          const result: T[] = [];
          for (let i = 0; i < draftObj.length; i++) {
            const item = draftObj.get(i)!;
            if (fn(item, i)) result.push(item);
          }
          return result;
        };
      }

      if (prop === 'forEach') {
        return (fn: (item: T, index: number) => void) => {
          for (let i = 0; i < draftObj.length; i++) {
            fn(draftObj.get(i)!, i);
          }
        };
      }

      if (prop === 'find') {
        return (fn: (item: T, index: number) => boolean) => {
          for (let i = 0; i < draftObj.length; i++) {
            const item = draftObj.get(i)!;
            if (fn(item, i)) return item;
          }
          return undefined;
        };
      }

      if (prop === 'findIndex') {
        return (fn: (item: T, index: number) => boolean) => {
          for (let i = 0; i < draftObj.length; i++) {
            if (fn(draftObj.get(i)!, i)) return i;
          }
          return -1;
        };
      }

      if (prop === 'some') {
        return (fn: (item: T, index: number) => boolean) => {
          for (let i = 0; i < draftObj.length; i++) {
            if (fn(draftObj.get(i)!, i)) return true;
          }
          return false;
        };
      }

      if (prop === 'every') {
        return (fn: (item: T, index: number) => boolean) => {
          for (let i = 0; i < draftObj.length; i++) {
            if (!fn(draftObj.get(i)!, i)) return false;
          }
          return true;
        };
      }

      if (prop === 'includes') {
        return (searchElement: T) => {
          for (let i = 0; i < draftObj.length; i++) {
            if (draftObj.get(i) === searchElement) return true;
          }
          return false;
        };
      }

      if (prop === 'indexOf') {
        return (searchElement: T) => {
          for (let i = 0; i < draftObj.length; i++) {
            if (draftObj.get(i) === searchElement) return i;
          }
          return -1;
        };
      }

      if (prop === 'reduce') {
        return <U>(fn: (acc: U, item: T, index: number) => U, initialValue: U) => {
          let acc = initialValue;
          for (let i = 0; i < draftObj.length; i++) {
            acc = fn(acc, draftObj.get(i)!, i);
          }
          return acc;
        };
      }

      return undefined;
    },

    set(_, prop, value) {
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index)) {
          draftObj.set(index, value);
          return true;
        }
      }
      if (prop === 'length') {
        draftObj.length = Number(value);
        return true;
      }
      return false;
    },
  });

  recipe(proxy);
  return draftObj.finalize();
}

// Version
export const VERSION = '0.2.0';
