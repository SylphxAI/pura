/**
 * Array Proxy - Lightweight Immer-like draft proxy for native arrays
 */

import { createNestedMapProxy, createNestedProxy, createNestedSetProxy } from "../index";

// Create a lightweight draft proxy for native arrays (Immer-like)
export function createNativeDraftProxy<T>(
  data: T[],
  markModified: () => void,
  proxies: Map<number, any>,
): T[] {
  const proxy = new Proxy(data, {
    get(target, prop, receiver) {
      if (prop === "length") return target.length;

      // Numeric index access with nested proxy support
      if (typeof prop === "string") {
        const idx = Number(prop);
        if (!isNaN(idx) && idx >= 0 && idx < target.length) {
          const cached = proxies.get(idx);
          if (cached) return cached;

          const value = target[idx];
          if (value !== null && typeof value === "object") {
            let nestedProxy: any;
            if (value instanceof Map) {
              nestedProxy = createNestedMapProxy(value as Map<any, any>, markModified);
            } else if (value instanceof Set) {
              nestedProxy = createNestedSetProxy(value as Set<any>, markModified);
            } else {
              nestedProxy = createNestedProxy(value as object, markModified);
            }
            proxies.set(idx, nestedProxy);
            return nestedProxy;
          }
          return value;
        }
      }

      // Array methods that mutate
      if (prop === "push") {
        return (...items: T[]) => {
          const result = target.push(...items);
          if (items.length > 0) markModified();
          return result;
        };
      }
      if (prop === "pop") {
        return () => {
          const result = target.pop();
          if (result !== undefined) markModified();
          return result;
        };
      }
      if (prop === "shift") {
        return () => {
          const result = target.shift();
          if (result !== undefined) markModified();
          return result;
        };
      }
      if (prop === "unshift") {
        return (...items: T[]) => {
          const result = target.unshift(...items);
          if (items.length > 0) markModified();
          return result;
        };
      }
      if (prop === "splice") {
        return (...args: any[]) => {
          // @ts-ignore - spread args from proxy
          const result = target.splice(...args);
          markModified();
          return result;
        };
      }
      if (prop === "sort" || prop === "reverse") {
        return (...args: any[]) => {
          const result = (target as any)[prop](...args);
          markModified();
          return proxy;
        };
      }

      // Delegate other properties/methods to target
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },

    set(target, prop, value) {
      if (typeof prop === "string") {
        const idx = Number(prop);
        if (!isNaN(idx) && idx >= 0) {
          target[idx] = value;
          proxies.delete(idx); // Clear cached proxy
          markModified();
          return true;
        }
      }
      if (prop === "length") {
        const oldLen = target.length;
        target.length = value;
        if (value !== oldLen) markModified();
        return true;
      }
      return Reflect.set(target, prop, value);
    },
  });

  return proxy;
}
