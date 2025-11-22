# Real-World Examples

Production-ready patterns for Redux, React, Zustand, and more.

## Redux

### Todo Reducer

```typescript
import { produceFast } from 'pura'

interface Todo {
  id: number
  text: string
  completed: boolean
}

type TodoState = Todo[]

type TodoAction =
  | { type: 'ADD_TODO'; payload: { text: string } }
  | { type: 'TOGGLE_TODO'; payload: { id: number } }
  | { type: 'UPDATE_TODO'; payload: { id: number; text: string } }
  | { type: 'DELETE_TODO'; payload: { id: number } }
  | { type: 'CLEAR_COMPLETED' }

const todosReducer = (state: TodoState = [], action: TodoAction): TodoState => {
  switch (action.type) {
    case 'ADD_TODO':
      return produceFast(state, $ => {
        $.push({
          id: Date.now(),
          text: action.payload.text,
          completed: false
        })
      })

    case 'TOGGLE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.payload.id) {
            $.set([i, 'completed'], !state[i].completed)
            break
          }
        }
      })

    case 'UPDATE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.payload.id) {
            $.set([i, 'text'], action.payload.text)
            break
          }
        }
      })

    case 'DELETE_TODO':
      return produceFast(state, $ => {
        for (let i = 0; i < state.length; i++) {
          if (state[i].id === action.payload.id) {
            $.splice(i, 1)
            break
          }
        }
      })

    case 'CLEAR_COMPLETED':
      return produceFast(state, $ => {
        return $.filter(todo => !todo.completed)
      })

    default:
      return state
  }
}
```

### Nested State Reducer

```typescript
import { produceFast } from 'pura'

interface AppState {
  user: {
    id: number | null
    name: string
    preferences: {
      theme: 'light' | 'dark'
      notifications: boolean
    }
  }
  todos: Todo[]
  ui: {
    loading: boolean
    error: string | null
  }
}

type AppAction =
  | { type: 'SET_USER'; payload: { id: number; name: string } }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | TodoAction

const rootReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return produceFast(state, $ => {
        $.set(['user', 'id'], action.payload.id)
        $.set(['user', 'name'], action.payload.name)
      })

    case 'SET_THEME':
      return produceFast(state, $ => {
        $.set(['user', 'preferences', 'theme'], action.payload)
      })

    case 'SET_LOADING':
      return produceFast(state, $ => {
        $.set(['ui', 'loading'], action.payload)
      })

    case 'SET_ERROR':
      return produceFast(state, $ => {
        $.set(['ui', 'error'], action.payload)
        $.set(['ui', 'loading'], false)
      })

    default:
      // Delegate to todosReducer for todo actions
      return produceFast(state, $ => {
        $.set(['todos'], todosReducer(state.todos, action as TodoAction))
      })
  }
}
```

## React

### useImmer Hook

```typescript
import { useState } from 'react'
import { produce } from 'pura'

function useImmer<T>(initialState: T | (() => T)) {
  const [state, setState] = useState(initialState)

  const updateState = (updater: (draft: T) => void) => {
    setState(current => produce(current, updater))
  }

  return [state, updateState] as const
}

// Usage
function TodoApp() {
  const [todos, updateTodos] = useImmer<Todo[]>([])

  const addTodo = (text: string) => {
    updateTodos(draft => {
      draft.push({
        id: Date.now(),
        text,
        completed: false
      })
    })
  }

  const toggleTodo = (id: number) => {
    updateTodos(draft => {
      const todo = draft.find(t => t.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    })
  }

  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

### useProduceFast Hook

```typescript
import { useState } from 'react'
import { produceFast } from 'pura'

function useProduceFast<T>(initialState: T | (() => T)) {
  const [state, setState] = useState(initialState)

  const updateState = (updater: (helper: FastHelper<T>) => void) => {
    setState(current => produceFast(current, updater))
  }

  return [state, updateState] as const
}

// Usage
function TodoApp() {
  const [todos, updateTodos] = useProduceFast<Todo[]>([])

  const addTodo = (text: string) => {
    updateTodos($ => {
      $.push({
        id: Date.now(),
        text,
        completed: false
      })
    })
  }

  const toggleTodo = (id: number) => {
    updateTodos($ => {
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
          $.set([i, 'completed'], !todos[i].completed)
          break
        }
      }
    })
  }

  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

### Complex Form State

```typescript
import { useState } from 'react'
import { produceFast } from 'pura'

interface FormState {
  values: {
    email: string
    password: string
    confirmPassword: string
    profile: {
      firstName: string
      lastName: string
      bio: string
    }
  }
  errors: Record<string, string>
  touched: Record<string, boolean>
  submitting: boolean
}

function useFormState() {
  const [form, setForm] = useState<FormState>({
    values: {
      email: '',
      password: '',
      confirmPassword: '',
      profile: {
        firstName: '',
        lastName: '',
        bio: ''
      }
    },
    errors: {},
    touched: {},
    submitting: false
  })

  const setField = (path: string[], value: any) => {
    setForm(current => produceFast(current, $ => {
      $.set(['values', ...path], value)
      $.set(['touched', path.join('.')], true)
      $.delete(['errors', path.join('.')])
    }))
  }

  const setError = (path: string[], error: string) => {
    setForm(current => produceFast(current, $ => {
      $.set(['errors', path.join('.')], error)
    }))
  }

  const setSubmitting = (submitting: boolean) => {
    setForm(current => produceFast(current, $ => {
      $.set(['submitting'], submitting)
    }))
  }

  return { form, setField, setError, setSubmitting }
}
```

## Zustand

### Todo Store

```typescript
import { create } from 'zustand'
import { produceFast } from 'pura'

interface Todo {
  id: number
  text: string
  completed: boolean
}

interface TodoStore {
  todos: Todo[]
  addTodo: (text: string) => void
  toggleTodo: (id: number) => void
  updateTodo: (id: number, text: string) => void
  deleteTodo: (id: number) => void
  clearCompleted: () => void
}

const useTodoStore = create<TodoStore>((set) => ({
  todos: [],

  addTodo: (text) => set((state) => ({
    todos: produceFast(state.todos, $ => {
      $.push({
        id: Date.now(),
        text,
        completed: false
      })
    })
  })),

  toggleTodo: (id) => set((state) => ({
    todos: produceFast(state.todos, $ => {
      for (let i = 0; i < state.todos.length; i++) {
        if (state.todos[i].id === id) {
          $.set([i, 'completed'], !state.todos[i].completed)
          break
        }
      }
    })
  })),

  updateTodo: (id, text) => set((state) => ({
    todos: produceFast(state.todos, $ => {
      for (let i = 0; i < state.todos.length; i++) {
        if (state.todos[i].id === id) {
          $.set([i, 'text'], text)
          break
        }
      }
    })
  })),

  deleteTodo: (id) => set((state) => ({
    todos: produceFast(state.todos, $ => {
      for (let i = 0; i < state.todos.length; i++) {
        if (state.todos[i].id === id) {
          $.splice(i, 1)
          break
        }
      }
    })
  })),

  clearCompleted: () => set((state) => ({
    todos: produceFast(state.todos, $ => {
      return $.filter(todo => !todo.completed)
    })
  }))
}))

// Usage
function TodoList() {
  const { todos, addTodo, toggleTodo } = useTodoStore()

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo.id)}
          />
          {todo.text}
        </div>
      ))}
    </div>
  )
}
```

### Nested State Store

```typescript
import { create } from 'zustand'
import { produceFast } from 'pura'

interface AppStore {
  user: {
    id: number | null
    name: string
    preferences: {
      theme: 'light' | 'dark'
      notifications: boolean
    }
  }
  todos: Todo[]
  ui: {
    loading: boolean
    error: string | null
  }

  // Actions
  setUser: (id: number, name: string) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addTodo: (text: string) => void
}

const useAppStore = create<AppStore>((set) => ({
  user: {
    id: null,
    name: '',
    preferences: {
      theme: 'light',
      notifications: true
    }
  },
  todos: [],
  ui: {
    loading: false,
    error: null
  },

  setUser: (id, name) => set((state) => produceFast(state, $ => {
    $.set(['user', 'id'], id)
    $.set(['user', 'name'], name)
  })),

  setTheme: (theme) => set((state) => produceFast(state, $ => {
    $.set(['user', 'preferences', 'theme'], theme)
  })),

  setLoading: (loading) => set((state) => produceFast(state, $ => {
    $.set(['ui', 'loading'], loading)
  })),

  setError: (error) => set((state) => produceFast(state, $ => {
    $.set(['ui', 'error'], error)
    $.set(['ui', 'loading'], false)
  })),

  addTodo: (text) => set((state) => produceFast(state, $ => {
    $.set(['todos'], produceFast(state.todos, todos => {
      todos.push({
        id: Date.now(),
        text,
        completed: false
      })
    }))
  }))
}))
```

## Vue

### Composition API

```typescript
import { ref } from 'vue'
import { produceFast } from 'pura'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export function useTodos() {
  const todos = ref<Todo[]>([])

  const addTodo = (text: string) => {
    todos.value = produceFast(todos.value, $ => {
      $.push({
        id: Date.now(),
        text,
        completed: false
      })
    })
  }

  const toggleTodo = (id: number) => {
    todos.value = produceFast(todos.value, $ => {
      for (let i = 0; i < todos.value.length; i++) {
        if (todos.value[i].id === id) {
          $.set([i, 'completed'], !todos.value[i].completed)
          break
        }
      }
    })
  }

  const deleteTodo = (id: number) => {
    todos.value = produceFast(todos.value, $ => {
      for (let i = 0; i < todos.value.length; i++) {
        if (todos.value[i].id === id) {
          $.splice(i, 1)
          break
        }
      }
    })
  }

  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo
  }
}
```

## Jotai

### Atom with Immer-like Updates

```typescript
import { atom } from 'jotai'
import { produceFast } from 'pura'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const todosAtom = atom<Todo[]>([])

const addTodoAtom = atom(
  null,
  (get, set, text: string) => {
    const todos = get(todosAtom)
    set(todosAtom, produceFast(todos, $ => {
      $.push({
        id: Date.now(),
        text,
        completed: false
      })
    }))
  }
)

const toggleTodoAtom = atom(
  null,
  (get, set, id: number) => {
    const todos = get(todosAtom)
    set(todosAtom, produceFast(todos, $ => {
      for (let i = 0; i < todos.length; i++) {
        if (todos[i].id === id) {
          $.set([i, 'completed'], !todos[i].completed)
          break
        }
      }
    }))
  }
)

// Usage
import { useAtom, useSetAtom } from 'jotai'

function TodoApp() {
  const [todos] = useAtom(todosAtom)
  const addTodo = useSetAtom(addTodoAtom)
  const toggleTodo = useSetAtom(toggleTodoAtom)

  return (
    <div>
      {/* ... */}
    </div>
  )
}
```

## Performance Tips

### Batch Updates

```typescript
// ❌ Multiple state updates
const handleBulkEdit = (ids: number[], updates: Partial<Todo>) => {
  ids.forEach(id => {
    updateTodo(id, updates)  // N state updates!
  })
}

// ✅ Single state update
const handleBulkEdit = (ids: number[], updates: Partial<Todo>) => {
  setTodos(current => produceFast(current, $ => {
    for (let i = 0; i < current.length; i++) {
      if (ids.includes(current[i].id)) {
        for (const [key, value] of Object.entries(updates)) {
          $.set([i, key as keyof Todo], value)
        }
      }
    }
  }))
}
```

### Avoid Unnecessary Renders

```typescript
import { memo } from 'react'
import { produceFast } from 'pura'

// Structural sharing prevents unnecessary renders
const TodoItem = memo(({ todo, onToggle }: { todo: Todo; onToggle: (id: number) => void }) => {
  console.log('Rendering todo:', todo.id)
  return (
    <div>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      {todo.text}
    </div>
  )
})

function TodoList({ todos }: { todos: Todo[] }) {
  const [localTodos, setLocalTodos] = useState(todos)

  const toggleTodo = (id: number) => {
    setLocalTodos(current => produceFast(current, $ => {
      for (let i = 0; i < current.length; i++) {
        if (current[i].id === id) {
          $.set([i, 'completed'], !current[i].completed)
          break
        }
      }
    }))
  }

  // Only toggled item re-renders!
  // Other items reuse same reference (structural sharing)
  return (
    <div>
      {localTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
      ))}
    </div>
  )
}
```

## Next Steps

- [produceFast() API](/api/produce-fast) - Optimized API reference
- [produce() API](/api/produce) - Immer-compatible API
- [Performance Guide](/guide/performance) - Optimization tips
- [Migration from Immer](/guide/migration-from-immer) - Easy migration path
