# Maps & Sets Examples

Real-world examples of working with Maps and Sets in Pura.

## Cache Management

### LRU Cache with Map

```typescript
import { produceFast } from '@sylphx/pura'

interface CacheEntry<T> {
  value: T
  timestamp: number
  hits: number
}

class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>
  private maxSize: number

  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    // Update hits and timestamp immutably
    this.cache = produceFast(this.cache, $ => {
      $.set(key, {
        ...entry,
        hits: entry.hits + 1,
        timestamp: Date.now()
      })
    })

    return entry.value
  }

  set(key: K, value: V): void {
    this.cache = produceFast(this.cache, $ => {
      $.set(key, {
        value,
        timestamp: Date.now(),
        hits: 0
      })

      // Evict oldest if over capacity
      if (this.cache.size > this.maxSize) {
        const oldest = Array.from(this.cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]

        if (oldest) {
          $.delete(oldest[0])
        }
      }
    })
  }
}
```

### Simple Cache

```typescript
import { produceFast } from '@sylphx/pura'

interface Cache {
  data: Map<string, any>
  timestamps: Map<string, number>
  ttl: number
}

const cache: Cache = {
  data: new Map(),
  timestamps: new Map(),
  ttl: 60000  // 1 minute
}

// Set cache entry
function setCacheEntry(cache: Cache, key: string, value: any): Cache {
  return produceFast(cache, $ => {
    $.set(['data'], produceFast(cache.data, d => d.set(key, value)))
    $.set(['timestamps'], produceFast(cache.timestamps, t => t.set(key, Date.now())))
  })
}

// Get cache entry (with expiration)
function getCacheEntry(cache: Cache, key: string): any | undefined {
  const timestamp = cache.timestamps.get(key)
  if (!timestamp) return undefined

  const age = Date.now() - timestamp
  if (age > cache.ttl) {
    // Expired - remove
    return undefined
  }

  return cache.data.get(key)
}

// Cleanup expired
function cleanupCache(cache: Cache): Cache {
  const now = Date.now()
  const expired: string[] = []

  for (const [key, timestamp] of cache.timestamps) {
    if (now - timestamp > cache.ttl) {
      expired.push(key)
    }
  }

  if (expired.length === 0) return cache

  return produceFast(cache, $ => {
    $.set(['data'], produceFast(cache.data, d => {
      for (const key of expired) d.delete(key)
    }))
    $.set(['timestamps'], produceFast(cache.timestamps, t => {
      for (const key of expired) t.delete(key)
    }))
  })
}
```

## User Permissions

### Permission Set

```typescript
import { produceFast } from '@sylphx/pura'

type Permission = 'read' | 'write' | 'delete' | 'admin'

interface User {
  id: number
  name: string
  permissions: Set<Permission>
}

const user: User = {
  id: 1,
  name: 'Alice',
  permissions: new Set(['read', 'write'])
}

// Grant permission
function grantPermission(user: User, permission: Permission): User {
  return produceFast(user, $ => {
    $.set(['permissions'], produceFast(user.permissions, p => {
      p.add(permission)
    }))
  })
}

// Revoke permission
function revokePermission(user: User, permission: Permission): User {
  return produceFast(user, $ => {
    $.set(['permissions'], produceFast(user.permissions, p => {
      p.delete(permission)
    }))
  })
}

// Check permission
function hasPermission(user: User, permission: Permission): boolean {
  return user.permissions.has(permission)
}
```

### Role-Based Access Control

```typescript
import { produceFast } from '@sylphx/pura'

interface RBAC {
  roles: Map<string, Set<Permission>>
  userRoles: Map<number, Set<string>>
}

const rbac: RBAC = {
  roles: new Map([
    ['viewer', new Set(['read'])],
    ['editor', new Set(['read', 'write'])],
    ['admin', new Set(['read', 'write', 'delete', 'admin'])]
  ]),
  userRoles: new Map([
    [1, new Set(['viewer'])],
    [2, new Set(['editor'])]
  ])
}

// Assign role to user
function assignRole(rbac: RBAC, userId: number, role: string): RBAC {
  return produceFast(rbac, $ => {
    const userRoles = rbac.userRoles.get(userId) || new Set()
    $.set(['userRoles'], produceFast(rbac.userRoles, m => {
      m.set(userId, produceFast(userRoles, s => s.add(role)))
    }))
  })
}

// Get user permissions (aggregated from roles)
function getUserPermissions(rbac: RBAC, userId: number): Set<Permission> {
  const userRoles = rbac.userRoles.get(userId)
  if (!userRoles) return new Set()

  const permissions = new Set<Permission>()
  for (const role of userRoles) {
    const rolePerms = rbac.roles.get(role)
    if (rolePerms) {
      for (const perm of rolePerms) {
        permissions.add(perm)
      }
    }
  }

  return permissions
}
```

## Tag Management

### Document Tags

```typescript
import { produceFast } from '@sylphx/pura'

interface Document {
  id: string
  title: string
  content: string
  tags: Set<string>
}

const doc: Document = {
  id: '1',
  title: 'Getting Started',
  content: '...',
  tags: new Set(['tutorial', 'beginner'])
}

// Add tag
function addTag(doc: Document, tag: string): Document {
  return produceFast(doc, $ => {
    $.set(['tags'], produceFast(doc.tags, s => s.add(tag)))
  })
}

// Remove tag
function removeTag(doc: Document, tag: string): Document {
  return produceFast(doc, $ => {
    $.set(['tags'], produceFast(doc.tags, s => s.delete(tag)))
  })
}

// Replace all tags
function setTags(doc: Document, tags: string[]): Document {
  return produceFast(doc, $ => {
    $.set(['tags'], new Set(tags))
  })
}
```

### Tag Indexing

```typescript
import { produceFast } from '@sylphx/pura'

interface TagIndex {
  tagToDocIds: Map<string, Set<string>>
  docIdToTags: Map<string, Set<string>>
}

const index: TagIndex = {
  tagToDocIds: new Map(),
  docIdToTags: new Map()
}

// Add document tags to index
function indexDocument(index: TagIndex, docId: string, tags: Set<string>): TagIndex {
  return produceFast(index, $ => {
    // Add to docIdToTags
    $.set(['docIdToTags'], produceFast(index.docIdToTags, m => {
      m.set(docId, tags)
    }))

    // Add to tagToDocIds
    $.set(['tagToDocIds'], produceFast(index.tagToDocIds, m => {
      for (const tag of tags) {
        const docIds = m.get(tag) || new Set()
        m.set(tag, produceFast(docIds, s => s.add(docId)))
      }
    }))
  })
}

// Find documents by tag
function findByTag(index: TagIndex, tag: string): Set<string> {
  return index.tagToDocIds.get(tag) || new Set()
}
```

## Session Management

### Active Sessions

```typescript
import { produceFast } from '@sylphx/pura'

interface Session {
  id: string
  userId: number
  createdAt: number
  lastActive: number
}

interface SessionStore {
  sessions: Map<string, Session>
  userSessions: Map<number, Set<string>>
}

const store: SessionStore = {
  sessions: new Map(),
  userSessions: new Map()
}

// Create session
function createSession(store: SessionStore, userId: number): SessionStore {
  const sessionId = crypto.randomUUID()
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: Date.now(),
    lastActive: Date.now()
  }

  return produceFast(store, $ => {
    // Add session
    $.set(['sessions'], produceFast(store.sessions, m => {
      m.set(sessionId, session)
    }))

    // Add to user sessions
    const userSessions = store.userSessions.get(userId) || new Set()
    $.set(['userSessions'], produceFast(store.userSessions, m => {
      m.set(userId, produceFast(userSessions, s => s.add(sessionId)))
    }))
  })
}

// Update session activity
function updateSessionActivity(store: SessionStore, sessionId: string): SessionStore {
  const session = store.sessions.get(sessionId)
  if (!session) return store

  return produceFast(store, $ => {
    $.set(['sessions'], produceFast(store.sessions, m => {
      m.set(sessionId, { ...session, lastActive: Date.now() })
    }))
  })
}

// Delete session
function deleteSession(store: SessionStore, sessionId: string): SessionStore {
  const session = store.sessions.get(sessionId)
  if (!session) return store

  return produceFast(store, $ => {
    // Remove session
    $.set(['sessions'], produceFast(store.sessions, m => {
      m.delete(sessionId)
    }))

    // Remove from user sessions
    const userSessions = store.userSessions.get(session.userId)
    if (userSessions) {
      $.set(['userSessions'], produceFast(store.userSessions, m => {
        m.set(session.userId, produceFast(userSessions, s => s.delete(sessionId)))
      }))
    }
  })
}
```

## Graph Data

### Simple Graph

```typescript
import { produceFast } from '@sylphx/pura'

interface Graph {
  nodes: Set<string>
  edges: Map<string, Set<string>>
}

const graph: Graph = {
  nodes: new Set(['A', 'B', 'C']),
  edges: new Map([
    ['A', new Set(['B', 'C'])],
    ['B', new Set(['C'])]
  ])
}

// Add node
function addNode(graph: Graph, node: string): Graph {
  return produceFast(graph, $ => {
    $.set(['nodes'], produceFast(graph.nodes, s => s.add(node)))
  })
}

// Add edge
function addEdge(graph: Graph, from: string, to: string): Graph {
  return produceFast(graph, $ => {
    // Ensure nodes exist
    $.set(['nodes'], produceFast(graph.nodes, s => {
      s.add(from)
      s.add(to)
    }))

    // Add edge
    const neighbors = graph.edges.get(from) || new Set()
    $.set(['edges'], produceFast(graph.edges, m => {
      m.set(from, produceFast(neighbors, s => s.add(to)))
    }))
  })
}

// Get neighbors
function getNeighbors(graph: Graph, node: string): Set<string> {
  return graph.edges.get(node) || new Set()
}
```

## Event Tracking

### Event Listeners

```typescript
import { produceFast } from '@sylphx/pura'

type EventHandler = (data: any) => void

interface EventEmitter {
  listeners: Map<string, Set<EventHandler>>
}

const emitter: EventEmitter = {
  listeners: new Map()
}

// Add listener
function addEventListener(
  emitter: EventEmitter,
  event: string,
  handler: EventHandler
): EventEmitter {
  return produceFast(emitter, $ => {
    const handlers = emitter.listeners.get(event) || new Set()
    $.set(['listeners'], produceFast(emitter.listeners, m => {
      m.set(event, produceFast(handlers, s => s.add(handler)))
    }))
  })
}

// Remove listener
function removeEventListener(
  emitter: EventEmitter,
  event: string,
  handler: EventHandler
): EventEmitter {
  const handlers = emitter.listeners.get(event)
  if (!handlers) return emitter

  return produceFast(emitter, $ => {
    $.set(['listeners'], produceFast(emitter.listeners, m => {
      m.set(event, produceFast(handlers, s => s.delete(handler)))
    }))
  })
}

// Emit event (read-only - no produceFast needed)
function emit(emitter: EventEmitter, event: string, data: any): void {
  const handlers = emitter.listeners.get(event)
  if (handlers) {
    for (const handler of handlers) {
      handler(data)
    }
  }
}
```

## Performance Note

For Maps and Sets larger than 512 entries, Pura uses HAMT (Hash Array Mapped Trie) for:
- **O(log₃₂ n)** operations (≈ constant time for practical sizes)
- **Structural sharing** (99% memory savings for single updates)
- **12-105× faster** than Immer

See [Understanding Adaptive Strategy](/guide/understanding-adaptive) for details.

## Next Steps

- [Array Examples](/examples/arrays) - Working with arrays
- [Object Examples](/examples/objects) - Nested objects
- [Real-World Examples](/examples/real-world) - Redux, React, Zustand
