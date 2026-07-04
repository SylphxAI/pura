# Pura Agent Instructions

## Scope

This file is the repo-local operating policy for agents working in
`SylphxAI/pura`. Org-wide engineering doctrine is owned by
`SylphxAI/doctrine`; `PROJECT.md`, `project.manifest.json`, and `.doctrine/project.json` own this
repository's local identity, lifecycle, boundary, and delivery facts.

Pura is a TypeScript library for native-type immutable updates and persistent
data structures. Its public contract is package behavior, type inference,
benchmarks, docs, and npm release evidence.

## Read First

1. `PROJECT.md`, `project.manifest.json`, and `.doctrine/project.json`.
2. `README.md` for public claims, examples, and benchmark positioning.
3. `packages/core/README.md`, `packages/core/package.json`, and
   `packages/core/src/` before changing the public package.
4. `docs/guide/` and `docs/api/` before changing documented behavior.
5. `.github/workflows/ci.yml` and `.github/workflows/release.yml` before
   changing validation or release.

## Non-Negotiables

- Preserve native JavaScript return types and TypeScript inference unless an
  explicit public contract decision changes them.
- Benchmark claims must be reproducible and linked to the benchmark/test setup.
- Do not add app-specific state semantics to the shared data-structure library.
- Package publishing must be Changesets-driven and workflow-owned.
- Do not publish from a human shell or personal token.

## Validation

- `bun run build`
- `bun run test`
- `bun run lint`
- `bun run typecheck`
- `bun run bench` when performance claims change

Docs-only boundary changes may be validated by diff review, referenced-file
checks, and the central project manifest audit.

Generated `.groundatlas*` reports are evidence/navigation only. Do not treat them as source of truth.
