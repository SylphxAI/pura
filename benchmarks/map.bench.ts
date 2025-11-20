import { bench, describe } from 'vitest';
import { IMap } from '../packages/core/src/map';

describe('IMap vs native Map - Small (10 entries)', () => {
  const entries = Array.from({ length: 10 }, (_, i) => [`key${i}`, i]);

  bench('IMap - create from entries', () => {
    IMap.of(entries);
  });

  bench('native Map - create from entries', () => {
    new Map(entries);
  });

  const imap = IMap.of(entries);
  const nmap = new Map(entries);

  bench('IMap - get', () => {
    imap.get('key5');
  });

  bench('native Map - get', () => {
    nmap.get('key5');
  });

  bench('IMap - set (immutable)', () => {
    imap.set('key5', 999);
  });

  bench('native Map - set (mutable)', () => {
    nmap.set('key5', 999);
  });

  bench('IMap - delete (immutable)', () => {
    imap.delete('key5');
  });

  bench('native Map - delete (mutable)', () => {
    nmap.delete('key5');
  });
});

describe('IMap vs native Map - Medium (100 entries)', () => {
  const entries = Array.from({ length: 100 }, (_, i) => [`key${i}`, i]);

  bench('IMap - create from 100 entries', () => {
    IMap.of(entries);
  });

  bench('native Map - create from 100 entries', () => {
    new Map(entries);
  });

  const imap = IMap.of(entries);
  const nmap = new Map(entries);

  bench('IMap - get (100 entries)', () => {
    imap.get('key50');
  });

  bench('native Map - get (100 entries)', () => {
    nmap.get('key50');
  });

  bench('IMap - set (100 entries)', () => {
    imap.set('key50', 999);
  });

  bench('native Map - set (100 entries)', () => {
    nmap.set('key50', 999);
  });
});

describe('IMap vs native Map - Large (1000 entries)', () => {
  const entries = Array.from({ length: 1000 }, (_, i) => [`key${i}`, i]);

  bench('IMap - create from 1000 entries', () => {
    IMap.of(entries);
  });

  bench('native Map - create from 1000 entries', () => {
    new Map(entries);
  });

  const imap = IMap.of(entries);
  const nmap = new Map(entries);

  bench('IMap - get (1000 entries)', () => {
    imap.get('key500');
  });

  bench('native Map - get (1000 entries)', () => {
    nmap.get('key500');
  });

  bench('IMap - set (1000 entries)', () => {
    imap.set('key500', 999);
  });

  bench('native Map - set (1000 entries)', () => {
    nmap.set('key500', 999);
  });

  bench('IMap - 10 sequential updates', () => {
    let map = imap;
    for (let i = 0; i < 10; i++) {
      map = map.set(`key${i}`, 999);
    }
  });

  bench('native Map - 10 sequential updates (mutable)', () => {
    const map = new Map(nmap);
    for (let i = 0; i < 10; i++) {
      map.set(`key${i}`, 999);
    }
  });
});

describe('IMap - Structural sharing benefits', () => {
  const imap = IMap.of(
    Array.from({ length: 1000 }, (_, i) => [`key${i}`, i])
  );

  bench('IMap - set same value (structural sharing)', () => {
    imap.set('key500', 500); // Same value - should return same map
  });

  bench('IMap - set new value', () => {
    imap.set('key500', 999);
  });

  bench('IMap - delete non-existent key', () => {
    imap.delete('nonexistent'); // Should return same map
  });
});

describe('IMap - Iteration performance', () => {
  const entries = Array.from({ length: 1000 }, (_, i) => [`key${i}`, i]);
  const imap = IMap.of(entries);
  const nmap = new Map(entries);

  bench('IMap - iterate all entries', () => {
    for (const [key, value] of imap) {
      // Access to prevent optimization
      key && value;
    }
  });

  bench('native Map - iterate all entries', () => {
    for (const [key, value] of nmap) {
      key && value;
    }
  });
});
