/**
 * Array Proxy - Cached leaf lookup for tree-backed vectors
 */

import { BITS, MASK } from "../index";
import type { Node } from "../types";
import type { PuraArrayState } from "./state";

export function vecGetCached<T>(state: PuraArrayState<T>, index: number): T | undefined {
  const { vec } = state;
  const { count, treeCount } = vec;
  if (index < 0 || index >= count) return undefined;

  if (index >= treeCount) {
    return vec.tail[index - treeCount];
  }

  const leafStart = index & ~MASK;

  if (state.cachedLeaf && state.cachedLeafStart === leafStart) {
    return state.cachedLeaf[index & MASK];
  }

  const { shift, root } = vec;
  let node: Node<T> = root;
  let level = shift;

  while (level > 0) {
    node = node.arr[(index >>> level) & MASK] as Node<T>;
    level -= BITS;
  }

  state.cachedLeaf = node.arr as T[];
  state.cachedLeafStart = leafStart;

  return node.arr[index & MASK] as T;
}
