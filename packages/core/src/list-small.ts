/**
 * Small List Optimizations
 *
 * Specialized implementations for small collections that bypass tree overhead.
 * These provide near-native performance for the majority of real-world use cases.
 *
 * Strategy (inspired by Fast Immutable Collections):
 * - Size 2-4: Direct field storage (zero overhead)
 * - Size ≤ 32: Flat array (minimal overhead)
 * - Size > 32: Regular persistent vector
 */

const SMALL_LIST_THRESHOLD = 32;

/**
 * Tiny list with exactly 2 elements
 * Zero overhead - just two fields
 */
export class IListOf2<T> {
  readonly size = 2;

  constructor(
    private readonly first: T,
    private readonly last: T
  ) {}

  get(index: number): T | undefined {
    if (index === 0) return this.first;
    if (index === 1) return this.last;
    return undefined;
  }

  set(index: number, value: T): IListOf2<T> {
    if (index === 0) return new IListOf2(value, this.last);
    if (index === 1) return new IListOf2(this.first, value);
    throw new RangeError(`Index out of bounds: ${index}`);
  }

  push(value: T): IListSmall<T> {
    return new IListSmall(Object.freeze([this.first, this.last, value]));
  }

  pop(): IListOf1<T> {
    return new IListOf1(this.first);
  }

  toArray(): T[] {
    return [this.first, this.last];
  }

  *[Symbol.iterator](): Iterator<T> {
    yield this.first;
    yield this.last;
  }
}

/**
 * Tiny list with exactly 3 elements
 */
export class IListOf3<T> {
  readonly size = 3;

  constructor(
    private readonly first: T,
    private readonly second: T,
    private readonly third: T
  ) {}

  get(index: number): T | undefined {
    if (index === 0) return this.first;
    if (index === 1) return this.second;
    if (index === 2) return this.third;
    return undefined;
  }

  set(index: number, value: T): IListOf3<T> {
    if (index === 0) return new IListOf3(value, this.second, this.third);
    if (index === 1) return new IListOf3(this.first, value, this.third);
    if (index === 2) return new IListOf3(this.first, this.second, value);
    throw new RangeError(`Index out of bounds: ${index}`);
  }

  push(value: T): IListSmall<T> {
    return new IListSmall(Object.freeze([this.first, this.second, this.third, value]));
  }

  pop(): IListOf2<T> {
    return new IListOf2(this.first, this.second);
  }

  toArray(): T[] {
    return [this.first, this.second, this.third];
  }

  *[Symbol.iterator](): Iterator<T> {
    yield this.first;
    yield this.second;
    yield this.third;
  }
}

/**
 * Tiny list with exactly 4 elements
 */
export class IListOf4<T> {
  readonly size = 4;

  constructor(
    private readonly first: T,
    private readonly second: T,
    private readonly third: T,
    private readonly fourth: T
  ) {}

  get(index: number): T | undefined {
    if (index === 0) return this.first;
    if (index === 1) return this.second;
    if (index === 2) return this.third;
    if (index === 3) return this.fourth;
    return undefined;
  }

  set(index: number, value: T): IListOf4<T> {
    if (index === 0) return new IListOf4(value, this.second, this.third, this.fourth);
    if (index === 1) return new IListOf4(this.first, value, this.third, this.fourth);
    if (index === 2) return new IListOf4(this.first, this.second, value, this.fourth);
    if (index === 3) return new IListOf4(this.first, this.second, this.third, value);
    throw new RangeError(`Index out of bounds: ${index}`);
  }

  push(value: T): IListSmall<T> {
    return new IListSmall(Object.freeze([this.first, this.second, this.third, this.fourth, value]));
  }

  pop(): IListOf3<T> {
    return new IListOf3(this.first, this.second, this.third);
  }

  toArray(): T[] {
    return [this.first, this.second, this.third, this.fourth];
  }

  *[Symbol.iterator](): Iterator<T> {
    yield this.first;
    yield this.second;
    yield this.third;
    yield this.fourth;
  }
}

/**
 * Single element list (edge case)
 */
export class IListOf1<T> {
  readonly size = 1;

  constructor(private readonly value: T) {}

  get(index: number): T | undefined {
    return index === 0 ? this.value : undefined;
  }

  set(index: number, value: T): IListOf1<T> {
    if (index !== 0) throw new RangeError(`Index out of bounds: ${index}`);
    return new IListOf1(value);
  }

  push(value: T): IListOf2<T> {
    return new IListOf2(this.value, value);
  }

  pop(): IListSmall<T> {
    return new IListSmall(Object.freeze([]));
  }

  toArray(): T[] {
    return [this.value];
  }

  *[Symbol.iterator](): Iterator<T> {
    yield this.value;
  }
}

/**
 * Small list (5-32 elements)
 * Uses flat array with structural sharing
 */
export class IListSmall<T> {
  readonly size: number;

  constructor(private readonly array: readonly T[]) {
    this.size = array.length;
  }

  get(index: number): T | undefined {
    return this.array[index];
  }

  set(index: number, value: T): IListSmall<T> {
    if (index < 0 || index >= this.size) {
      throw new RangeError(`Index out of bounds: ${index}`);
    }
    const newArray = this.array.slice();
    (newArray as T[])[index] = value;
    return new IListSmall(Object.freeze(newArray));
  }

  push(value: T): IListSmall<T> {
    const newArray = [...this.array, value];
    return new IListSmall(Object.freeze(newArray));
  }

  pop(): IListSmall<T> | IListOf4<T> {
    const newArray = this.array.slice(0, -1);
    if (newArray.length === 4) {
      return new IListOf4(newArray[0]!, newArray[1]!, newArray[2]!, newArray[3]!);
    }
    return new IListSmall(Object.freeze(newArray));
  }

  toArray(): T[] {
    return [...this.array];
  }

  *[Symbol.iterator](): Iterator<T> {
    yield* this.array;
  }
}

/**
 * Helper type for small list types
 */
export type SmallList<T> =
  | IListOf1<T>
  | IListOf2<T>
  | IListOf3<T>
  | IListOf4<T>
  | IListSmall<T>;

/**
 * Check if size qualifies for small list optimization
 */
export function isSmallSize(size: number): boolean {
  return size <= SMALL_LIST_THRESHOLD;
}

/**
 * Create optimized small list based on size
 */
export function createSmallList<T>(items: T[]): SmallList<T> {
  const len = items.length;

  if (len === 0) {
    return new IListSmall(Object.freeze([]));
  }
  if (len === 1) {
    return new IListOf1(items[0]!);
  }
  if (len === 2) {
    return new IListOf2(items[0]!, items[1]!);
  }
  if (len === 3) {
    return new IListOf3(items[0]!, items[1]!, items[2]!);
  }
  if (len === 4) {
    return new IListOf4(items[0]!, items[1]!, items[2]!, items[3]!);
  }

  // 5-32 elements: use flat array
  return new IListSmall(Object.freeze([...items]));
}

export { SMALL_LIST_THRESHOLD };
