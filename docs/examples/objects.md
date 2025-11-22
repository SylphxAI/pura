# Object Examples

Real-world examples of working with nested objects in Pura.

## User Profile

### Update Basic Info

```typescript
import { produceFast } from 'pura'

interface User {
  id: number
  name: string
  email: string
  profile: {
    bio: string
    avatar: string
    settings: {
      theme: 'light' | 'dark'
      notifications: boolean
    }
  }
}

const user: User = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  profile: {
    bio: 'Software engineer',
    avatar: '/avatars/alice.jpg',
    settings: {
      theme: 'light',
      notifications: true
    }
  }
}

// Update name
const updated = produceFast(user, $ => {
  $.set(['name'], 'Alice Updated')
})

// Update nested theme
const darkMode = produceFast(user, $ => {
  $.set(['profile', 'settings', 'theme'], 'dark')
})
```

### Merge Settings

```typescript
import { produceFast } from 'pura'

function updateSettings(user: User, newSettings: Partial<User['profile']['settings']>): User {
  return produceFast(user, $ => {
    $.merge(['profile', 'settings'], newSettings)
  })
}

// Usage
const updated = updateSettings(user, {
  theme: 'dark',
  notifications: false
})
```

### Update Multiple Fields

```typescript
import { produceFast } from 'pura'

function updateProfile(
  user: User,
  updates: { name?: string; email?: string; bio?: string }
): User {
  return produceFast(user, $ => {
    if (updates.name) $.set(['name'], updates.name)
    if (updates.email) $.set(['email'], updates.email)
    if (updates.bio) $.set(['profile', 'bio'], updates.bio)
  })
}

// Usage
const updated = updateProfile(user, {
  name: 'Alice Smith',
  bio: 'Senior Software Engineer'
})
```

## Application State

### Complex State Tree

```typescript
import { produceFast } from 'pura'

interface AppState {
  user: {
    id: number
    name: string
    preferences: {
      theme: string
      language: string
    }
  }
  ui: {
    sidebar: {
      open: boolean
      width: number
    }
    modal: {
      type: string | null
      data: any
    }
  }
  data: {
    items: Array<{ id: number; title: string }>
    loading: boolean
    error: string | null
  }
}

const initialState: AppState = {
  user: {
    id: 1,
    name: 'Alice',
    preferences: {
      theme: 'light',
      language: 'en'
    }
  },
  ui: {
    sidebar: {
      open: true,
      width: 250
    },
    modal: {
      type: null,
      data: null
    }
  },
  data: {
    items: [],
    loading: false,
    error: null
  }
}

// Toggle sidebar
const toggleSidebar = (state: AppState): AppState => {
  return produceFast(state, $ => {
    $.update(['ui', 'sidebar', 'open'], open => !open)
  })
}

// Show modal
const showModal = (state: AppState, type: string, data: any): AppState => {
  return produceFast(state, $ => {
    $.set(['ui', 'modal', 'type'], type)
    $.set(['ui', 'modal', 'data'], data)
  })
}

// Set loading
const setLoading = (state: AppState, loading: boolean): AppState => {
  return produceFast(state, $ => {
    $.set(['data', 'loading'], loading)
    if (loading) {
      $.set(['data', 'error'], null)
    }
  })
}

// Set error
const setError = (state: AppState, error: string): AppState => {
  return produceFast(state, $ => {
    $.set(['data', 'error'], error)
    $.set(['data', 'loading'], false)
  })
}
```

## Form State

### Form with Validation

```typescript
import { produceFast } from 'pura'

interface FormState {
  values: {
    email: string
    password: string
    confirmPassword: string
  }
  errors: {
    email?: string
    password?: string
    confirmPassword?: string
  }
  touched: {
    email: boolean
    password: boolean
    confirmPassword: boolean
  }
  submitting: boolean
}

const initialForm: FormState = {
  values: {
    email: '',
    password: '',
    confirmPassword: ''
  },
  errors: {},
  touched: {
    email: false,
    password: false,
    confirmPassword: false
  },
  submitting: false
}

// Update field
function setField<K extends keyof FormState['values']>(
  form: FormState,
  field: K,
  value: FormState['values'][K]
): FormState {
  return produceFast(form, $ => {
    $.set(['values', field], value)
    $.set(['touched', field], true)

    // Clear error
    $.delete(['errors', field])
  })
}

// Set error
function setFieldError<K extends keyof FormState['errors']>(
  form: FormState,
  field: K,
  error: string
): FormState {
  return produceFast(form, $ => {
    $.set(['errors', field], error)
  })
}

// Set submitting
function setSubmitting(form: FormState, submitting: boolean): FormState {
  return produceFast(form, $ => {
    $.set(['submitting'], submitting)
  })
}
```

## Configuration

### Nested Configuration

```typescript
import { produceFast } from 'pura'

interface Config {
  api: {
    baseUrl: string
    timeout: number
    retries: number
  }
  features: {
    darkMode: boolean
    analytics: boolean
    beta: {
      enabled: boolean
      features: string[]
    }
  }
  cache: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
}

const config: Config = {
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    retries: 3
  },
  features: {
    darkMode: false,
    analytics: true,
    beta: {
      enabled: false,
      features: []
    }
  },
  cache: {
    enabled: true,
    ttl: 3600,
    maxSize: 100
  }
}

// Update API config
const updateApi = (config: Config, updates: Partial<Config['api']>): Config => {
  return produceFast(config, $ => {
    $.merge(['api'], updates)
  })
}

// Enable beta feature
const enableBetaFeature = (config: Config, feature: string): Config => {
  return produceFast(config, $ => {
    $.set(['features', 'beta', 'enabled'], true)

    const features = config.features.beta.features
    if (!features.includes(feature)) {
      $.set(['features', 'beta', 'features'], [...features, feature])
    }
  })
}
```

## Entity Management

### Normalized State

```typescript
import { produceFast } from 'pura'

interface NormalizedState {
  entities: {
    users: Record<number, {
      id: number
      name: string
      email: string
    }>
    posts: Record<number, {
      id: number
      title: string
      authorId: number
      content: string
    }>
  }
  ids: {
    users: number[]
    posts: number[]
  }
}

const state: NormalizedState = {
  entities: {
    users: {
      1: { id: 1, name: 'Alice', email: 'alice@example.com' },
      2: { id: 2, name: 'Bob', email: 'bob@example.com' }
    },
    posts: {
      1: { id: 1, title: 'Post 1', authorId: 1, content: '...' },
      2: { id: 2, title: 'Post 2', authorId: 2, content: '...' }
    }
  },
  ids: {
    users: [1, 2],
    posts: [1, 2]
  }
}

// Add user
function addUser(
  state: NormalizedState,
  user: { id: number; name: string; email: string }
): NormalizedState {
  return produceFast(state, $ => {
    $.set(['entities', 'users', user.id], user)
    $.set(['ids', 'users'], [...state.ids.users, user.id])
  })
}

// Update user
function updateUser(
  state: NormalizedState,
  userId: number,
  updates: Partial<{ name: string; email: string }>
): NormalizedState {
  return produceFast(state, $ => {
    const user = state.entities.users[userId]
    if (user) {
      $.set(['entities', 'users', userId], { ...user, ...updates })
    }
  })
}

// Delete user
function deleteUser(state: NormalizedState, userId: number): NormalizedState {
  return produceFast(state, $ => {
    $.delete(['entities', 'users', userId])
    $.set(['ids', 'users'], state.ids.users.filter(id => id !== userId))
  })
}
```

## Deep Merging

### Merge Nested Objects

```typescript
import { produceFast } from 'pura'

interface DeepObject {
  level1: {
    level2: {
      level3: {
        value: number
        meta: {
          updated: number
          by: string
        }
      }
    }
  }
}

const obj: DeepObject = {
  level1: {
    level2: {
      level3: {
        value: 42,
        meta: {
          updated: Date.now(),
          by: 'system'
        }
      }
    }
  }
}

// Deep update with merge
const updated = produceFast(obj, $ => {
  $.merge(['level1', 'level2', 'level3', 'meta'], {
    updated: Date.now(),
    by: 'alice'
  })
})
```

## Structural Sharing

### Verify Unchanged Parts Reused

```typescript
import { produceFast } from 'pura'

const state = {
  user: {
    id: 1,
    name: 'Alice',
    profile: {
      bio: 'Engineer',
      settings: {
        theme: 'light'
      }
    }
  },
  data: {
    items: [1, 2, 3],
    metadata: {
      count: 3
    }
  }
}

// Update only theme
const next = produceFast(state, $ => {
  $.set(['user', 'profile', 'settings', 'theme'], 'dark')
})

// Verify structural sharing
console.log(state.data === next.data)  // true (unchanged - reused!)
console.log(state.user.id === next.user.id)  // true (unchanged)
console.log(state.user.profile.bio === next.user.profile.bio)  // true (unchanged)

// Only the path to 'theme' is copied
console.log(state.user.profile.settings === next.user.profile.settings)  // false (changed)
console.log(state.user.profile === next.user.profile)  // false (parent copied)
console.log(state.user === next.user)  // false (parent copied)
console.log(state === next)  // false (root copied)
```

## Performance Tips

### Path-based vs Nested produce()

```typescript
// ❌ Don't nest produce() calls
const bad = produce(state, draft => {
  draft.user = produce(draft.user, userDraft => {
    userDraft.name = 'Updated'
  })
})

// ✅ Use single produceFast with path
const good = produceFast(state, $ => {
  $.set(['user', 'name'], 'Updated')
})
```

### Batch Multiple Updates

```typescript
// ❌ Multiple produce calls
let state = initialState
state = produceFast(state, $ => $.set(['user', 'name'], 'Alice'))
state = produceFast(state, $ => $.set(['ui', 'sidebar', 'open'], false))

// ✅ Single produce call
const next = produceFast(initialState, $ => {
  $.set(['user', 'name'], 'Alice')
  $.set(['ui', 'sidebar', 'open'], false)
})
```

## Next Steps

- [Array Examples](/examples/arrays) - Working with arrays
- [Maps & Sets Examples](/examples/maps-sets) - Collections
- [Real-World Examples](/examples/real-world) - Redux, React, Zustand
