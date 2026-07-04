# ADR 0001: Add GroundAtlas Project-Control Gate

## Status

Accepted

## Context

Pura is a public production foundation package for immutable updates and persistent data structures. It already had a PR/merge-group `Test` workflow, but it did not expose a vendor-neutral project manifest and did not dogfood the released GroundAtlas package/action.

Its release workflow also used a repo-local Changesets action path whose `publish` command points at the intentionally-disabled direct `bun run release` script. Package publication should instead go through the shared Sylphx release workflow with inherited organization credentials and trusted publishing identity.

The project-control surface must not make `.doctrine/project.json` a public default and must not make generated `.groundatlas*` reports authoritative. This change must not alter Pura's package API behavior, benchmark claims, docs content, or downstream state-management responsibilities.

The current `bun run lint`/Biome baseline has a pre-existing formatting/import-order backlog. Blocking this adoption slice on a lint cleanup would hide the actual delivery boundary, so lint is recorded as a separate adoption gap and the CI gate preserves the existing build/test baseline.

## Decision

Add:

- a vendor-neutral `project.manifest.json`;
- CI steps that run `bun run validate`, project-control tests, and `SylphxAI/groundatlas@v0.1.2` with `groundatlas@0.1.2`;
- assertions that GroundAtlas selects `project.manifest.json`, reports `.doctrine/project.json` only as an adapter, and has zero strict fleet warnings/blockers;
- a small Node project-control boundary test;
- shared Sylphx release workflow delegation with caller-side `id-token: write`;
- docs/spec/ADR/PROJECT/AGENTS updates that clarify GroundAtlas as evidence/navigation, not SSOT;
- a tracked `lint-baseline` adoption gap for the existing Biome backlog.

## Consequences

- Pull requests and merge groups now get package build/test validation plus GroundAtlas package/action dogfooding.
- `.doctrine/project.json` remains the Sylphx Doctrine adapter and local governance catalog.
- Release proof remains a successful main Release workflow plus npm registry readback for changed packages.
- Generated `.groundatlas*` reports remain evidence/navigation only.
- Lint is not falsely presented as green; it is a separate cleanup slice before it can become a required context.
