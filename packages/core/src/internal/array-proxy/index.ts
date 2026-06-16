/**
 * Array Proxy - Persistent vector with Array-like interface
 *
 * Barrel preserving the original `./array-proxy` public surface:
 *   - PuraArrayState (type)
 *   - ARRAY_STATE_ENV
 *   - createArrayProxy
 *   - produceArray
 */

export type { PuraArrayState } from "./state";
export { ARRAY_STATE_ENV } from "./state";
export { createArrayProxy } from "./proxy";
export { produceArray } from "./produce";
