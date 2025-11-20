/**
 * ISet: Persistent Set built on HAMT
 *
 * A set is essentially a map where values are the keys themselves.
 */

import { IMap } from './map';
import type { Set as ISetInterface } from './types';

const PRESENT = true;

/**
 * Immutable Persistent Set
 */
export class ISet<T = any> implements ISetInterface<T> {
  private constructor(private readonly map: IMap<T, boolean>) {}

  /**
   * Create an empty set
   */
  static empty<T>(): ISet<T> {
    return new ISet<T>(IMap.empty());
  }

  /**
   * Create a set from values
   */
  static of<T>(...values: T[]): ISet<T> {
    return ISet.from(values);
  }

  /**
   * Create from iterable
   */
  static from<T>(values: Iterable<T>): ISet<T> {
    let set = ISet.empty<T>();
    for (const value of values) {
      set = set.add(value);
    }
    return set;
  }

  /**
   * Get size
   */
  get size(): number {
    return this.map.size;
  }

  /**
   * Check if value exists
   */
  has(value: T): boolean {
    return this.map.has(value);
  }

  /**
   * Add value (returns new set)
   */
  add(value: T): ISet<T> {
    const newMap = this.map.set(value, PRESENT);
    return newMap === this.map ? this : new ISet(newMap);
  }

  /**
   * Delete value (returns new set)
   */
  delete(value: T): ISet<T> {
    const newMap = this.map.delete(value);
    return newMap === this.map ? this : new ISet(newMap);
  }

  /**
   * Union with another set
   */
  union(other: ISet<T>): ISet<T> {
    let result = this;
    for (const value of other) {
      result = result.add(value);
    }
    return result;
  }

  /**
   * Intersection with another set
   */
  intersection(other: ISet<T>): ISet<T> {
    let result = ISet.empty<T>();
    for (const value of this) {
      if (other.has(value)) {
        result = result.add(value);
      }
    }
    return result;
  }

  /**
   * Difference with another set
   */
  difference(other: ISet<T>): ISet<T> {
    let result = this;
    for (const value of other) {
      result = result.delete(value);
    }
    return result;
  }

  /**
   * Map over values
   */
  map<U>(fn: (value: T) => U): ISet<U> {
    let result = ISet.empty<U>();
    for (const value of this) {
      result = result.add(fn(value));
    }
    return result;
  }

  /**
   * Filter values
   */
  filter(fn: (value: T) => boolean): ISet<T> {
    let result = ISet.empty<T>();
    for (const value of this) {
      if (fn(value)) {
        result = result.add(value);
      }
    }
    return result;
  }

  /**
   * Convert to array
   */
  toArray(): T[] {
    return Array.from(this);
  }

  /**
   * Iterator
   */
  [Symbol.iterator](): Iterator<T> {
    return this.map.keys();
  }

  /**
   * Convert to string
   */
  toString(): string {
    const values = Array.from(this).map(String).join(', ');
    return `ISet(${this.size}) { ${values} }`;
  }

  /**
   * Deep equality
   */
  equals(other: ISet<T>): boolean {
    if (this === other) return true;
    if (this.size !== other.size) return false;

    for (const value of this) {
      if (!other.has(value)) {
        return false;
      }
    }

    return true;
  }
}
