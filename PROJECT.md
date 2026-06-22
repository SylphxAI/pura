# Pura Project

Pura is a TypeScript immutable-update and persistent-data-structure library. It
returns native JavaScript types while providing fast immutable operations,
Immer-compatible migration paths, `produceFast`, benchmarks, docs, and an npm
package under `@sylphx/pura`.

## Lifecycle

- Lifecycle: `production`
- Layer: `foundation`
- Doctrine source of truth: [SylphxAI/doctrine](https://github.com/SylphxAI/doctrine)
- Machine manifest: `.doctrine/project.json`

## Goals

- Provide a fast, type-safe immutable update library for native Array/Object/Map
  and Set values.
- Own the `@sylphx/pura` package, public APIs, persistent data-structure
  implementation, docs, tests, and benchmarks.
- Keep benchmark and compatibility claims reproducible.

## Non-Goals

- Do not own downstream application state models or product-specific update
  semantics.
- Do not make performance claims without reproducible benchmark context.
- Do not publish package changes without Changesets intent, CI, and npm readback.

## Boundaries

Pura owns package APIs, type definitions, implementation, tests, docs, migration
guides, and benchmarks for immutable native-type data structures. It does not
own downstream application behavior, UI frameworks, storage/persistence layers,
or runtime product decisions.

## Delivery

PRs use the `Test` workflow context. Main release uses Changesets through
`.github/workflows/release.yml`. Package publication is forward-fix only after
npm release.
