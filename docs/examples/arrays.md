# Array Examples

Real-world examples of working with arrays in Pura.

## Todo List

### Add Todo

```typescript
import { produceFast } from '@sylphx/pura'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todos: Todo[] = [
  { id: 1, text: 'Buy milk', completed: false },
  { id: 2, text: 'Walk dog', completed: true }
]

// Add new todo
const next = produceFast(todos, $ => {
  $.push({
    id: Date.now(),
    text: 'Code review',
    completed: false
  })
})
```

### Toggle Todo

```typescript
import { produceFast } from '@sylphx/pura'

function toggleTodo(todos: Todo[], id: number): Todo[] {
  return produceFast(todos, $ => {
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        $.set([i, 'completed'], !todos[i].completed)
        break
      }
    }
  })
}

// Usage
const toggled = toggleTodo(todos, 1)
```

### Delete Todo

```typescript
import { produceFast } from '@sylphx/pura'

function deleteTodo(todos: Todo[], id: number): Todo[] {
  return produceFast(todos, $ => {
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === id) {
        $.splice(i, 1)
        break
      }
    }
  })
}
```

### Filter Completed

```typescript
import { produceFast } from '@sylphx/pura'

function removeCompleted(todos: Todo[]): Todo[] {
  return produceFast(todos, $ => {
    return $.filter(todo => !todo.completed)  // Must return!
  })
}
```

## Shopping Cart

### Add Item

```typescript
import { produceFast } from '@sylphx/pura'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

const cart: CartItem[] = [
  { id: 1, name: 'Laptop', price: 999, quantity: 1 }
]

// Add item (or increment if exists)
function addToCart(cart: CartItem[], product: { id: number; name: string; price: number }): CartItem[] {
  return produceFast(cart, $ => {
    // Check if item exists
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id === product.id) {
        $.set([i, 'quantity'], cart[i].quantity + 1)
        return
      }
    }

    // Add new item
    $.push({ ...product, quantity: 1 })
  })
}
```

### Update Quantity

```typescript
import { produceFast } from '@sylphx/pura'

function updateQuantity(cart: CartItem[], id: number, quantity: number): CartItem[] {
  if (quantity <= 0) {
    // Remove item
    return produceFast(cart, $ => {
      for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
          $.splice(i, 1)
          break
        }
      }
    })
  }

  // Update quantity
  return produceFast(cart, $ => {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        $.set([i, 'quantity'], quantity)
        break
      }
    }
  })
}
```

### Calculate Total

```typescript
function calculateTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// Read-only operation - no need for produceFast!
```

## Message List

### Add Message

```typescript
import { produceFast } from '@sylphx/pura'

interface Message {
  id: string
  author: string
  text: string
  timestamp: number
  reactions: string[]
}

const messages: Message[] = []

function addMessage(messages: Message[], text: string, author: string): Message[] {
  return produceFast(messages, $ => {
    $.push({
      id: crypto.randomUUID(),
      author,
      text,
      timestamp: Date.now(),
      reactions: []
    })
  })
}
```

### Add Reaction

```typescript
import { produceFast } from '@sylphx/pura'

function addReaction(messages: Message[], messageId: string, emoji: string): Message[] {
  return produceFast(messages, $ => {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].id === messageId) {
        const reactions = messages[i].reactions
        $.set([i, 'reactions'], [...reactions, emoji])
        break
      }
    }
  })
}
```

### Edit Message

```typescript
import { produceFast } from '@sylphx/pura'

function editMessage(messages: Message[], messageId: string, newText: string): Message[] {
  return produceFast(messages, $ => {
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].id === messageId) {
        $.set([i, 'text'], newText)
        break
      }
    }
  })
}
```

## Table Data

### Sort Table

```typescript
import { produceFast } from '@sylphx/pura'

interface User {
  id: number
  name: string
  email: string
  age: number
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
  { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 }
]

function sortBy(users: User[], key: keyof User, ascending = true): User[] {
  return produceFast(users, $ => {
    $.sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return ascending ? cmp : -cmp
    })
  })
}

// Usage
const sorted = sortBy(users, 'age', false)  // Descending by age
```

### Update Row

```typescript
import { produceFast } from '@sylphx/pura'

function updateUser(users: User[], id: number, updates: Partial<User>): User[] {
  return produceFast(users, $ => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === id) {
        for (const [key, value] of Object.entries(updates)) {
          $.set([i, key as keyof User], value)
        }
        break
      }
    }
  })
}

// Usage
const updated = updateUser(users, 1, { age: 31, name: 'Alice Updated' })
```

### Delete Row

```typescript
import { produceFast } from '@sylphx/pura'

function deleteUser(users: User[], id: number): User[] {
  return produceFast(users, $ => {
    for (let i = 0; i < users.length; i++) {
      if (users[i].id === id) {
        $.splice(i, 1)
        break
      }
    }
  })
}
```

## Batch Operations

### Batch Update

```typescript
import { produceFast } from '@sylphx/pura'

function batchUpdate<T extends { id: number }>(
  items: T[],
  updates: Array<{ id: number; changes: Partial<T> }>
): T[] {
  return produceFast(items, $ => {
    for (const { id, changes } of updates) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) {
          for (const [key, value] of Object.entries(changes)) {
            $.set([i, key as keyof T], value)
          }
          break
        }
      }
    }
  })
}

// Usage
const batched = batchUpdate(users, [
  { id: 1, changes: { age: 31 } },
  { id: 2, changes: { name: 'Bob Updated' } },
  { id: 3, changes: { email: 'charlie.new@example.com' } }
])
```

### Bulk Delete

```typescript
import { produceFast } from '@sylphx/pura'

function bulkDelete<T extends { id: number }>(items: T[], ids: number[]): T[] {
  const idSet = new Set(ids)

  return produceFast(items, $ => {
    return $.filter(item => !idSet.has(item.id))  // Must return!
  })
}

// Usage
const remaining = bulkDelete(users, [1, 3])  // Delete users 1 and 3
```

## Performance Tips

### Read from Base, Write with Helper

```typescript
// ✅ Good - read from base parameter
produceFast(todos, $ => {
  for (let i = 0; i < todos.length; i++) {  // Read from base
    if (todos[i].completed) {
      $.delete(i)  // Write with helper
    }
  }
})

// ❌ Avoid - reading from helper has proxy overhead
produceFast(todos, $ => {
  // Don't iterate $.length - use base parameter instead
})
```

### Batch Multiple Operations

```typescript
// ❌ Multiple produce calls
let state = todos
state = produceFast(state, $ => $.set([0, 'completed'], true))
state = produceFast(state, $ => $.set([1, 'text'], 'Updated'))

// ✅ Single produce call
const next = produceFast(todos, $ => {
  $.set([0, 'completed'], true)
  $.set([1, 'text'], 'Updated')
})
```

## Next Steps

- [Object Examples](/examples/objects) - Working with nested objects
- [Maps & Sets Examples](/examples/maps-sets) - Collections
- [Real-World Examples](/examples/real-world) - Redux, React, Zustand
