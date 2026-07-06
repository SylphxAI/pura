# Project-Control Gate Spec

## Goal

Validate Pura's project-control and GroundAtlas adoption surfaces without changing package API behavior, benchmark claims, docs-site content, or downstream state-management semantics.

## Scope

The gate validates repository control-plane facts only:

- neutral identity and truth homes live in `project.manifest.json`;
- Sylphx-specific governance facts remain in `.doctrine/project.json`;
- generated `.groundatlas*` files plus GroundAtlas JSON/Markdown reports are evidence/navigation only;
- package validation for this slice is `bun run validate`, matching the current build and package test baseline;
- the existing `bun run lint`/Biome backlog is tracked as an adoption gap and must be fixed in a dedicated package-quality slice before lint becomes a required context;
- package release proof remains the Release workflow plus npm registry/readback when versions change.

It does not own downstream application state models, UI framework behavior, storage/persistence layers, product runtime decisions, or shared organization rulesets.

## CI Contract

`.github/workflows/ci.yml` must:

1. run on `push`, `pull_request`, and `merge_group`;
2. install dependencies with `bun install --frozen-lockfile`;
3. run `bun run validate`;
4. run `node --test test/project-control.node-test.mjs`;
5. run `SylphxAI/groundatlas@v0.1.3` with `package-spec: groundatlas@0.1.3`, `require-atlas: "true"`, and `strict: "true"`;
6. assert that GroundAtlas selects `project.manifest.json` and treats `.doctrine/project.json` only as an adapter;
7. assert the Markdown fleet scorecard title and adopted summary;
8. upload the manifest, JSON fleet, and Markdown fleet reports as `groundatlas-package-dogfood`.

## Acceptance

- `bun run validate` passes.
- `node --test test/project-control.node-test.mjs` passes.
- `ga audit` passes after `ga update`.
- `ga manifest --json` selects `project.manifest.json`.
- `ga fleet --require-atlas --strict --json` reports one adopted project with zero warnings and zero blockers.
- the Markdown fleet report contains the adopted summary.
- The release workflow delegates to `SylphxAI/.github/.github/workflows/release.yml@main` with `id-token: write`.
