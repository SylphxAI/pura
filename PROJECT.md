# Pura Project

Pura is a TypeScript immutable-update and persistent-data-structure library. It
returns native JavaScript types while providing fast immutable operations,
Immer-compatible migration paths, `produceFast`, benchmarks, docs, and an npm
package under `@sylphx/pura`.

## Lifecycle

- Lifecycle: `production`
- Layer: `foundation`
- Doctrine source of truth: [SylphxAI/doctrine](https://github.com/SylphxAI/doctrine)
- Vendor-neutral project manifest: [`project.manifest.json`](./project.manifest.json)
- Sylphx Doctrine adapter: [`.doctrine/project.json`](./.doctrine/project.json)

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

PRs use the `Test` workflow context with `bun run validate`, project-control boundary tests, and GroundAtlas package dogfooding. Main release delegates to the shared Sylphx release workflow through `.github/workflows/release.yml`. Package publication is forward-fix only after npm readback. Generated `.groundatlas*` files plus GroundAtlas JSON/Markdown reports are evidence/navigation only, not source of truth. The current Biome/lint backlog is tracked as a separate adoption gap before lint becomes a required context.
