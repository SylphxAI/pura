# Contributing to Pura

Thank you for your interest in contributing! 🎉

## Development Setup

```bash
# Clone the repo
git clone https://github.com/sylphxltd/pura.git
cd pura

# Install dependencies
bun install

# Run tests
bun test

# Run benchmarks
bun bench

# Type check
bun run typecheck

# Lint
bun run lint
```

## Project Structure

```
pura/
├── packages/
│   ├── core/              # Persistent data structures (HAMT, RRB-Tree)
│   ├── optics/            # Lens, Prism, Traversal
│   ├── transducers/       # Transducer implementation
│   └── react/             # React integration
├── benchmarks/            # Performance benchmarks
├── docs/                  # Documentation
└── examples/              # Usage examples
```

## Development Workflow

1. **Create a branch**: `git checkout -b feat/your-feature`
2. **Make changes**: Write code + tests
3. **Test**: `bun test`
4. **Benchmark**: `bun bench` (if performance-critical)
5. **Commit**: Use conventional commits
6. **Push**: `git push origin feat/your-feature`
7. **PR**: Create pull request

## Coding Standards

- **TypeScript**: Strict mode, no `any`
- **Tests**: 100% coverage for core algorithms
- **Performance**: Benchmark critical paths
- **Documentation**: JSDoc for all public APIs
- **Commits**: Conventional commits (feat, fix, docs, etc.)

## What to Contribute

### High Priority
- [ ] HAMT implementation (IMap, ISet)
- [ ] RRB-Tree implementation (IList)
- [ ] Comprehensive benchmarks
- [ ] Documentation

### Future
- [ ] Optics (Lens, Prism)
- [ ] Transducers
- [ ] React hooks
- [ ] Migration tools

## Questions?

Open an issue or discussion on GitHub!
