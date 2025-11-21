/**
 * Pura - High-performance data structures with dual modes
 *
 * Two modes:
 * 1. Mutable: const arr = pura([1,2,3]); arr.push(4) // direct mutation
 * 2. Immutable: const b = produce(arr, draft => draft.push(4)) // structural sharing
 *
 * Both modes use efficient tree structure internally
 * Type is always T[] (Proxy-based)
 */

// ===== Tree Configuration =====
const BITS = 5;
const BRANCH_FACTOR = 1 << BITS;  // 32

// ===== Internal tracking =====
const TREE_STATE = new WeakMap<any[], TreeState<any>>();

interface TreeState<T> {
  root: TreeNode<T>;
  length: number;
}

interface TreeNode<T> {
  items?: T[];
  children?: TreeNode<T>[];
  size: number;
}

// ===== Internal: Create efficient array =====
function createEfficientArray<T>(items: T[]): T[] {
  const state: TreeState<T> = {
    root: createLeaf(items),
    length: items.length
  };

  const proxy = new Proxy([] as T[], {
    get(_, prop) {
      // Numeric index: arr[0]
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index) && index >= 0 && index < state.length) {
          return treeGet(state.root, index);
        }
      }

      // length
      if (prop === 'length') return state.length;

      // Mutable operations
      if (prop === 'push') {
        return (...items: T[]) => {
          for (const item of items) {
            state.root = treePush(state.root, item);
            state.length++;
          }
          return state.length;
        };
      }

      if (prop === 'pop') {
        return () => {
          if (state.length === 0) return undefined;
          const lastItem = treeGet(state.root, state.length - 1);
          state.root = treePop(state.root);
          state.length--;
          return lastItem;
        };
      }

      // All native array methods
      if (prop === 'map') {
        return <U>(fn: (item: T, index: number) => U): U[] => {
          const result: U[] = [];
          for (let i = 0; i < state.length; i++) {
            result.push(fn(treeGet(state.root, i)!, i));
          }
          return result;
        };
      }

      if (prop === 'filter') {
        return (fn: (item: T, index: number) => boolean): T[] => {
          const result: T[] = [];
          for (let i = 0; i < state.length; i++) {
            const item = treeGet(state.root, i)!;
            if (fn(item, i)) result.push(item);
          }
          return result;
        };
      }

      if (prop === 'forEach') {
        return (fn: (item: T, index: number) => void): void => {
          for (let i = 0; i < state.length; i++) {
            fn(treeGet(state.root, i)!, i);
          }
        };
      }

      if (prop === 'reduce') {
        return <U>(fn: (acc: U, item: T, index: number) => U, initialValue: U): U => {
          let acc = initialValue;
          for (let i = 0; i < state.length; i++) {
            acc = fn(acc, treeGet(state.root, i)!, i);
          }
          return acc;
        };
      }

      if (prop === 'find') {
        return (fn: (item: T, index: number) => boolean): T | undefined => {
          for (let i = 0; i < state.length; i++) {
            const item = treeGet(state.root, i)!;
            if (fn(item, i)) return item;
          }
          return undefined;
        };
      }

      if (prop === 'findIndex') {
        return (fn: (item: T, index: number) => boolean): number => {
          for (let i = 0; i < state.length; i++) {
            if (fn(treeGet(state.root, i)!, i)) return i;
          }
          return -1;
        };
      }

      if (prop === 'includes') {
        return (searchElement: T): boolean => {
          for (let i = 0; i < state.length; i++) {
            if (treeGet(state.root, i) === searchElement) return true;
          }
          return false;
        };
      }

      if (prop === 'indexOf') {
        return (searchElement: T): number => {
          for (let i = 0; i < state.length; i++) {
            if (treeGet(state.root, i) === searchElement) return i;
          }
          return -1;
        };
      }

      if (prop === 'slice') {
        return (start?: number, end?: number): T[] => {
          return toArray(state).slice(start, end);
        };
      }

      if (prop === 'concat') {
        return (...items: any[]): T[] => {
          return toArray(state).concat(...items);
        };
      }

      if (prop === 'join') {
        return (separator?: string): string => {
          return toArray(state).join(separator);
        };
      }

      if (prop === 'some') {
        return (fn: (item: T, index: number) => boolean): boolean => {
          for (let i = 0; i < state.length; i++) {
            if (fn(treeGet(state.root, i)!, i)) return true;
          }
          return false;
        };
      }

      if (prop === 'every') {
        return (fn: (item: T, index: number) => boolean): boolean => {
          for (let i = 0; i < state.length; i++) {
            if (!fn(treeGet(state.root, i)!, i)) return false;
          }
          return true;
        };
      }

      // Iterator
      if (prop === Symbol.iterator) {
        return function* () {
          for (let i = 0; i < state.length; i++) {
            yield treeGet(state.root, i)!;
          }
        };
      }

      if (prop === 'toString' || prop === 'toLocaleString') {
        return () => toArray(state).toString();
      }

      if (prop === Symbol.toStringTag) {
        return 'Array';
      }

      // Custom inspect for console.log (Node.js/Bun)
      if (prop === 'inspect' || (typeof Symbol !== 'undefined' && prop === Symbol.for('nodejs.util.inspect.custom'))) {
        return () => toArray(state);
      }

      return undefined;
    },

    set(_, prop, value) {
      // Allow index assignment
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index) && index >= 0) {
          if (index < state.length) {
            // Update existing index
            state.root = treeSet(state.root, index, value);
            return true;
          }
          if (index === state.length) {
            // Append at end
            state.root = treePush(state.root, value);
            state.length++;
            return true;
          }
        }
      }

      return false;
    },

    has(_, prop) {
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index)) {
          return index >= 0 && index < state.length;
        }
      }
      return prop === 'length';
    },

    ownKeys(target) {
      const keys: (string | symbol)[] = [];
      for (let i = 0; i < state.length; i++) {
        keys.push(String(i));
      }
      keys.push('length');

      // Include symbol properties from target (nodejs.util.inspect.custom, etc.)
      const targetSymbols = Object.getOwnPropertySymbols(target);
      for (const sym of targetSymbols) {
        keys.push(sym);
      }

      return keys;
    },

    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'length') {
        return { value: state.length, writable: true, enumerable: false, configurable: false };
      }
      if (typeof prop === 'string') {
        const index = Number(prop);
        if (!Number.isNaN(index) && index >= 0 && index < state.length) {
          return { value: treeGet(state.root, index), writable: true, enumerable: true, configurable: true };
        }
      }

      // Delegate to target for symbol properties and other properties
      const targetDesc = Object.getOwnPropertyDescriptor(target, prop);
      if (targetDesc) {
        return targetDesc;
      }

      return undefined;
    }
  });

  TREE_STATE.set(proxy, state);

  // Add custom inspect for better console.log output
  try {
    const inspect = Symbol.for('nodejs.util.inspect.custom');
    Object.defineProperty(proxy, inspect, {
      value: () => toArray(state),
      enumerable: false,
      writable: false,
      configurable: false
    });
  } catch (e) {
    // Ignore if Symbol is not supported
  }

  return proxy;
}

// ===== Check if array is efficient =====
function isEfficient<T>(arr: T[]): boolean {
  return TREE_STATE.has(arr);
}

function getState<T>(arr: T[]): TreeState<T> | undefined {
  return TREE_STATE.get(arr);
}

// ===== Draft =====
class Draft<T> {
  private modifications: Map<number, T> = new Map();
  private appends: T[] = [];
  private removed: Set<number> = new Set();

  constructor(
    private readonly state: TreeState<T>,
    private readonly base: T[]
  ) {}

  get(index: number): T | undefined {
    if (this.removed.has(index)) return undefined;

    if (this.modifications.has(index)) {
      return this.modifications.get(index);
    }

    const appendIndex = index - this.state.length;
    if (appendIndex >= 0 && appendIndex < this.appends.length) {
      return this.appends[appendIndex];
    }

    return treeGet(this.state.root, index);
  }

  set(index: number, value: T): void {
    if (index < 0) return;

    if (index < this.state.length) {
      this.modifications.set(index, value);
      this.removed.delete(index);
    } else {
      const appendIndex = index - this.state.length;
      this.appends[appendIndex] = value;
    }
  }

  push(...items: T[]): number {
    this.appends.push(...items);
    return this.state.length + this.appends.length;
  }

  pop(): T | undefined {
    // Pop from appends first
    if (this.appends.length > 0) {
      return this.appends.pop();
    }

    // Pop from state - find last non-removed index
    for (let i = this.state.length - 1; i >= 0; i--) {
      if (!this.removed.has(i)) {
        const value = treeGet(this.state.root, i);
        this.removed.add(i);
        return value;
      }
    }

    return undefined;
  }

  get length(): number {
    return this.state.length + this.appends.length - this.removed.size;
  }

  finalize(): T[] {
    // Reference identity - no changes
    if (this.modifications.size === 0 && this.appends.length === 0 && this.removed.size === 0) {
      return this.base;
    }

    let newRoot = this.state.root;
    let newLength = this.state.length;

    // Apply modifications
    for (const [index, value] of this.modifications) {
      newRoot = treeSet(newRoot, index, value);
    }

    // Apply appends
    for (const item of this.appends) {
      newRoot = treePush(newRoot, item);
      newLength++;
    }

    // Apply removals
    for (const index of this.removed) {
      if (index === newLength - 1) {
        newRoot = treePop(newRoot);
        newLength--;
      }
    }

    return createEfficientArray(toArray({ root: newRoot, length: newLength }));
  }
}

// ===== PUBLIC API: pura() - Create efficient array =====
export function pura<T>(items: T[]): T[] {
  // Already efficient? Return as-is
  if (isEfficient(items)) {
    return items;
  }
  // Native array -> create efficient array
  return createEfficientArray([...items]);
}

// ===== PUBLIC API: unpura() - Convert to native array =====
export function unpura<T>(items: T[]): T[] {
  // Already native? Return as-is
  if (!isEfficient(items)) {
    return items;
  }
  // Efficient array -> convert to native
  const state = getState(items)!;
  return toArray(state);
}

// ===== PUBLIC API: produce() - Immutable updates with structural sharing =====
export function produce<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  // Convert native array to efficient array if needed
  if (!isEfficient(base)) {
    base = createEfficientArray([...base]);
  }

  const state = getState(base)!;
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

      // Support all array methods on draft
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
      return false;
    },
  });

  recipe(proxy);
  return draftObj.finalize();
}

// ===== Tree Operations =====

function createLeaf<T>(items: T[]): TreeNode<T> {
  return { items, size: items.length };
}

function createBranch<T>(children: TreeNode<T>[]): TreeNode<T> {
  let size = 0;
  for (let i = 0; i < children.length; i++) {
    size += children[i]!.size;
  }
  return { children, size };
}

function treeGet<T>(node: TreeNode<T>, index: number): T | undefined {
  if (node.items) {
    return node.items[index];
  }

  const children = node.children!;
  let offset = 0;

  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const nextOffset = offset + child.size;

    if (index < nextOffset) {
      return treeGet(child, index - offset);
    }

    offset = nextOffset;
  }

  return undefined;
}

function toArray<T>(state: TreeState<T>): T[] {
  const result = new Array(state.length);
  treeToArray(state.root, result, 0);
  return result;
}

function treeToArray<T>(node: TreeNode<T>, result: T[], offset: number): number {
  if (node.items) {
    for (let i = 0; i < node.items.length; i++) {
      result[offset + i] = node.items[i]!;
    }
    return offset + node.items.length;
  }

  const children = node.children!;
  let currentOffset = offset;

  for (let i = 0; i < children.length; i++) {
    currentOffset = treeToArray(children[i]!, result, currentOffset);
  }

  return currentOffset;
}

function treeSet<T>(node: TreeNode<T>, index: number, value: T): TreeNode<T> {
  if (node.items) {
    const newItems = node.items.slice();
    newItems[index] = value;
    return createLeaf(newItems);
  }

  const children = node.children!;
  let offset = 0;

  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const nextOffset = offset + child.size;

    if (index < nextOffset) {
      const newChildren = children.slice();
      newChildren[i] = treeSet(child, index - offset, value);
      return createBranch(newChildren);
    }

    offset = nextOffset;
  }

  return node;
}

function treePush<T>(node: TreeNode<T>, value: T): TreeNode<T> {
  if (node.items) {
    const items = node.items;

    if (items.length < BRANCH_FACTOR) {
      const newItems = new Array(items.length + 1);
      for (let i = 0; i < items.length; i++) {
        newItems[i] = items[i];
      }
      newItems[items.length] = value;
      return createLeaf(newItems);
    }

    return createBranch([node, createLeaf([value])]);
  }

  const children = node.children!;
  const lastIndex = children.length - 1;
  const lastChild = children[lastIndex]!;

  if (lastChild.size < BRANCH_FACTOR) {
    const newChildren = children.slice();
    newChildren[lastIndex] = treePush(lastChild, value);
    return createBranch(newChildren);
  }

  const newChildren = new Array(children.length + 1);
  for (let i = 0; i < children.length; i++) {
    newChildren[i] = children[i];
  }
  newChildren[children.length] = createLeaf([value]);
  return createBranch(newChildren);
}

function treePop<T>(node: TreeNode<T>): TreeNode<T> {
  if (node.items) {
    const items = node.items;
    if (items.length <= 1) {
      return createLeaf([]);
    }
    return createLeaf(items.slice(0, -1));
  }

  const children = node.children!;
  const lastIndex = children.length - 1;
  const lastChild = children[lastIndex]!;

  const newLastChild = treePop(lastChild);

  if (newLastChild.size === 0) {
    if (children.length === 1) {
      return createLeaf([]);
    }
    return createBranch(children.slice(0, -1));
  }

  const newChildren = children.slice();
  newChildren[lastIndex] = newLastChild;
  return createBranch(newChildren);
}

// Version
export const VERSION = '0.1.0';
