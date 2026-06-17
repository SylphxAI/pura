/**
 * Array Proxy - produce() entry point with adaptive native/tree strategy
 */

import {
  ARRAY_ADAPTIVE_THRESHOLD,
  extractNestedValue,
  vecAssoc,
  vecFromArray,
  vecGet,
  vecToArray,
} from "../index";
import type { Owner, Vec } from "../types";
import { createNativeDraftProxy } from "./native-draft";
import { createArrayProxy } from "./proxy";
import type { PuraArrayState } from "./state";
import { ARRAY_STATE_ENV } from "./state";

export function produceArray<T>(base: T[], recipe: (draft: T[]) => void): T[] {
  const baseState = ARRAY_STATE_ENV.get(base);
  const isBaseProxy = !!baseState;
  const baseLength = isBaseProxy ? baseState.vec.count : base.length;

  // Case 1: native small → native (Immer-like approach)
  if (!isBaseProxy && baseLength < ARRAY_ADAPTIVE_THRESHOLD) {
    const draftData = base.slice(); // shallow copy
    let modified = false;
    const proxies = new Map<number, any>();

    const draft = createNativeDraftProxy(
      draftData,
      () => {
        modified = true;
      },
      proxies,
    );
    recipe(draft);

    // Finalize nested proxies
    if (proxies.size > 0) {
      for (const [idx, nestedProxy] of proxies) {
        const finalValue = extractNestedValue(nestedProxy);
        if (finalValue !== draftData[idx]) {
          draftData[idx] = finalValue;
          modified = true;
        }
      }
    }

    if (!modified) return base;

    // Check result size: upgrade to tree if large
    if (draftData.length >= ARRAY_ADAPTIVE_THRESHOLD) {
      const vec = vecFromArray(draftData);
      const finalState: PuraArrayState<T> = {
        vec,
        isDraft: false,
        owner: undefined,
        modified: false,
      };
      return createArrayProxy<T>(finalState);
    }

    // Still small → return native
    return draftData;
  }

  // Case 2 & 3: large native or already proxy → use tree
  const baseVec = isBaseProxy ? baseState.vec : vecFromArray(base);

  const draftOwner: Owner = {};
  const draftVec: Vec<T> = {
    count: baseVec.count,
    shift: baseVec.shift,
    root: baseVec.root,
    tail: baseVec.tail,
    treeCount: baseVec.treeCount,
  };

  const draftState: PuraArrayState<T> = {
    vec: draftVec,
    isDraft: true,
    owner: draftOwner,
    modified: false,
  };

  const draft = createArrayProxy<T>(draftState);
  recipe(draft);

  // Finalize nested proxies
  if (draftState.proxies && draftState.proxies.size > 0) {
    for (const [idx, nestedProxy] of draftState.proxies) {
      const finalValue = extractNestedValue(nestedProxy);
      if (finalValue !== vecGet(draftState.vec, idx)) {
        draftState.vec = vecAssoc(draftState.vec, draftOwner, idx, finalValue as T);
        draftState.modified = true;
      }
    }
  }

  if (!draftState.modified) return base;

  // Case 4: Check result size - downgrade to native if small
  if (draftState.vec.count < ARRAY_ADAPTIVE_THRESHOLD) {
    return vecToArray(draftState.vec);
  }

  // Still large → return tree proxy
  const finalState: PuraArrayState<T> = {
    vec: draftState.vec,
    isDraft: false,
    owner: undefined,
    modified: false,
  };

  return createArrayProxy<T>(finalState);
}
