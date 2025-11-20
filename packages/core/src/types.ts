/**
 * Core type definitions for Pura collections
 */

/**
 * Persistent List interface
 */
export interface List<T> {
  // Query
  readonly size: number
  get(index: number): T | undefined
  has(index: number): boolean

  // Modification (returns new List)
  set(index: number, value: T): List<T>
  push(value: T): List<T>
  pop(): List<T>
  unshift(value: T): List<T>
  shift(): List<T>

  // Bulk operations
  concat(other: List<T>): List<T>
  slice(start?: number, end?: number): List<T>

  // Transformation
  map<U>(fn: (value: T, index: number) => U): List<U>
  filter(fn: (value: T, index: number) => boolean): List<T>
  reduce<U>(fn: (acc: U, value: T, index: number) => U, initial: U): U

  // Conversion
  toArray(): T[]

  // Iteration
  [Symbol.iterator](): Iterator<T>
}

/**
 * Persistent Map interface
 */
export interface Map<K, V> {
  // Query
  readonly size: number
  get(key: K): V | undefined
  has(key: K): boolean

  // Modification (returns new Map)
  set(key: K, value: V): Map<K, V>
  delete(key: K): Map<K, V>

  // Transformation
  map<V2>(fn: (value: V, key: K) => V2): Map<K, V2>
  filter(fn: (value: V, key: K) => boolean): Map<K, V>

  // Conversion
  toObject(): Record<string, V>

  // Iteration
  keys(): Iterator<K>
  values(): Iterator<V>
  entries(): Iterator<[K, V]>
  [Symbol.iterator](): Iterator<[K, V]>
}

/**
 * Persistent Set interface
 */
export interface Set<T> {
  // Query
  readonly size: number
  has(value: T): boolean

  // Modification (returns new Set)
  add(value: T): Set<T>
  delete(value: T): Set<T>

  // Set operations
  union(other: Set<T>): Set<T>
  intersection(other: Set<T>): Set<T>
  difference(other: Set<T>): Set<T>

  // Transformation
  map<U>(fn: (value: T) => U): Set<U>
  filter(fn: (value: T) => boolean): Set<T>

  // Conversion
  toArray(): T[]

  // Iteration
  [Symbol.iterator](): Iterator<T>
}
