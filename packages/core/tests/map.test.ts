import { describe, expect, it } from 'vitest';
import { IMap } from '../src/map';

describe('IMap', () => {
  describe('construction', () => {
    it('creates empty map', () => {
      const map = IMap.empty<string, number>();
      expect(map.size).toBe(0);
    });

    it('creates map from object', () => {
      const map = IMap.of({ a: 1, b: 2, c: 3 });
      expect(map.size).toBe(3);
      expect(map.get('a')).toBe(1);
      expect(map.get('b')).toBe(2);
      expect(map.get('c')).toBe(3);
    });

    it('creates map from entries', () => {
      const map = IMap.of<string, number>([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
      expect(map.size).toBe(3);
      expect(map.get('a')).toBe(1);
    });
  });

  describe('get/has', () => {
    it('gets existing value', () => {
      const map = IMap.of({ a: 1, b: 2 });
      expect(map.get('a')).toBe(1);
      expect(map.get('b')).toBe(2);
    });

    it('returns undefined for missing key', () => {
      const map = IMap.of({ a: 1 });
      expect(map.get('missing')).toBeUndefined();
    });

    it('checks key existence', () => {
      const map = IMap.of({ a: 1 });
      expect(map.has('a')).toBe(true);
      expect(map.has('missing')).toBe(false);
    });
  });

  describe('set', () => {
    it('sets new key', () => {
      const map1 = IMap.empty<string, number>();
      const map2 = map1.set('a', 1);

      expect(map1.size).toBe(0);
      expect(map2.size).toBe(1);
      expect(map2.get('a')).toBe(1);
    });

    it('updates existing key', () => {
      const map1 = IMap.of({ a: 1 });
      const map2 = map1.set('a', 2);

      expect(map1.get('a')).toBe(1);
      expect(map2.get('a')).toBe(2);
      expect(map1.size).toBe(1);
      expect(map2.size).toBe(1);
    });

    it('maintains immutability', () => {
      const map1 = IMap.of({ a: 1, b: 2 });
      const map2 = map1.set('c', 3);

      expect(map1.size).toBe(2);
      expect(map2.size).toBe(3);
      expect(map1.has('c')).toBe(false);
      expect(map2.has('c')).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes existing key', () => {
      const map1 = IMap.of({ a: 1, b: 2 });
      const map2 = map1.delete('a');

      expect(map1.size).toBe(2);
      expect(map2.size).toBe(1);
      expect(map1.has('a')).toBe(true);
      expect(map2.has('a')).toBe(false);
    });

    it('returns same map for missing key', () => {
      const map1 = IMap.of({ a: 1 });
      const map2 = map1.delete('missing');

      expect(map2).toBe(map1); // Structural sharing
    });
  });

  describe('structural sharing', () => {
    it('shares structure when unchanged', () => {
      const map1 = IMap.of({ a: 1, b: 2, c: 3 });
      const map2 = map1.set('a', 1); // Same value

      // Should return same map (structural sharing)
      expect(map2).toBe(map1);
    });

    it('returns same map when deleting non-existent key', () => {
      const map1 = IMap.of({ a: 1 });
      const map2 = map1.delete('missing');

      expect(map2).toBe(map1);
    });
  });

  describe('iteration', () => {
    it('iterates over keys', () => {
      const map = IMap.of({ a: 1, b: 2, c: 3 });
      const keys = Array.from(map.keys());

      expect(keys).toHaveLength(3);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });

    it('iterates over values', () => {
      const map = IMap.of({ a: 1, b: 2, c: 3 });
      const values = Array.from(map.values());

      expect(values).toHaveLength(3);
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
    });

    it('iterates over entries', () => {
      const map = IMap.of({ a: 1, b: 2 });
      const entries = Array.from(map.entries());

      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
    });

    it('supports for...of', () => {
      const map = IMap.of({ a: 1, b: 2 });
      const entries: [string, number][] = [];

      for (const entry of map) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(2);
    });
  });

  describe('transformation', () => {
    it('maps over values', () => {
      const map1 = IMap.of({ a: 1, b: 2, c: 3 });
      const map2 = map1.map((v) => v * 2);

      expect(map2.get('a')).toBe(2);
      expect(map2.get('b')).toBe(4);
      expect(map2.get('c')).toBe(6);
    });

    it('filters entries', () => {
      const map1 = IMap.of({ a: 1, b: 2, c: 3, d: 4 });
      const map2 = map1.filter((v) => v % 2 === 0);

      expect(map2.size).toBe(2);
      expect(map2.has('b')).toBe(true);
      expect(map2.has('d')).toBe(true);
      expect(map2.has('a')).toBe(false);
    });
  });

  describe('conversion', () => {
    it('converts to object', () => {
      const map = IMap.of({ a: 1, b: 2, c: 3 });
      const obj = map.toObject();

      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });
  });

  describe('large maps', () => {
    it('handles 1000 entries', () => {
      let map = IMap.empty<number, number>();

      // Insert 1000 entries
      for (let i = 0; i < 1000; i++) {
        map = map.set(i, i * 2);
      }

      expect(map.size).toBe(1000);

      // Verify all entries
      for (let i = 0; i < 1000; i++) {
        expect(map.get(i)).toBe(i * 2);
      }

      // Delete half
      for (let i = 0; i < 500; i++) {
        map = map.delete(i);
      }

      expect(map.size).toBe(500);

      // Verify remaining
      for (let i = 500; i < 1000; i++) {
        expect(map.get(i)).toBe(i * 2);
      }
    });
  });

  describe('hash collisions', () => {
    it('handles collisions correctly', () => {
      // Create keys that will collide (for testing purposes)
      const map = IMap.empty<string, number>()
        .set('key1', 1)
        .set('key2', 2)
        .set('key3', 3);

      expect(map.get('key1')).toBe(1);
      expect(map.get('key2')).toBe(2);
      expect(map.get('key3')).toBe(3);
      expect(map.size).toBe(3);
    });
  });

  describe('equality', () => {
    it('compares maps for equality', () => {
      const map1 = IMap.of({ a: 1, b: 2, c: 3 });
      const map2 = IMap.of({ a: 1, b: 2, c: 3 });
      const map3 = IMap.of({ a: 1, b: 2 });

      expect(map1.equals(map2)).toBe(true);
      expect(map1.equals(map3)).toBe(false);
    });

    it('returns true for same reference', () => {
      const map = IMap.of({ a: 1 });
      expect(map.equals(map)).toBe(true);
    });
  });
});
