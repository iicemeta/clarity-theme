# Testing

**English** | [简体中文](./testing.zh-CN.md)

The verification suite is layered and strictly serial — each layer assumes the previous one passed. Command source of truth: `package.json` scripts, `scripts/**`, `tests/**`, and `.github/workflows/ci.yml`. The generated feature-by-feature matrix lives in [compatibility](../reference/compatibility.md).

## Layer 1 — static and contract checks (Node matrix)

| Command | Coverage |
| --- | --- |
| `pnpm lint` | ESLint (source, scripts, tests, docs) + Stylelint (Vue/SCSS) |
| `pnpm typecheck` | Playground `nuxt typecheck` against the workspace-linked Layer |
| `pnpm verify` | Theme purity: no upstream author/site leakage, no site files, no cross-project imports |
| `pnpm test:sync` | Upstream-sync tool regression (manifest categories, conflicts, rollback) |
| `pnpm test:migration` | Migration skill structure, fixture mapping, and protected-asset contract |
| `pnpm test:contract` | Compatibility contract completeness + generated doc sync (no build) |
| `pnpm peers check` | Peer dependency audit |
| `pnpm docs:check` | Documentation governance (version pollution, pairing, links, changelog order) |

## Layer 2 — playground generation (primary Node)

| Command | Coverage |
| --- | --- |
| `pnpm generate` | Workspace-linked Layer static generation of the playground |

## Layer 3 — real consumers and rendering (primary Node)

| Command | Coverage |
| --- | --- |
| `pnpm test:consumer` | `pnpm pack` → independent install → five exports smoke → typecheck → three configuration-branch generations with output assertions |
| `pnpm test:compatibility` | Playground production build SSR + real browser (CDP) + dev hydration, driven by `scripts/compatibility-cases.mjs` |
| `pnpm test:create` | Creator CLI behavior tests |
| `pnpm test:create:e2e` | Generated consumer install/typecheck/generate E2E |
| `pnpm test:create:tarball` | Packed creator binary E2E |

## Release-only checks

| Command | Coverage |
| --- | --- |
| `pnpm release:check` | Tag/version contract, changelog entry, exports/files/engines/peers, pack success, tarball boundary |
| `pnpm test:registry-consumer` | Installs the **published registry version** (not a local tarball) into a temporary consumer and runs exports/typecheck/generate assertions |

Together the consumer layers form: workspace → tarball → registry.

## When to run what

- **Any source change:** `pnpm lint`, `pnpm typecheck`, then the targeted suite for the area (contract for config/content, consumer for packaging/exports, compatibility for rendering).
- **Docs-only change:** `pnpm docs:check` + `pnpm lint`.
- **Before tagging a release:** the full ordered suite in [publishing](./publishing.md); the publish workflow reruns it on the exact tag.
- **After publishing:** `pnpm test:registry-consumer` against the published version.

## Conventions

- Run commands serially; do not start concurrent dev/build/test processes over the same tree.
- Debug a single compatibility case with `node scripts/test-compatibility.mjs --filter=<id>`.
- `--contract-only`, `--no-build`, `--no-browser`, and `--no-dev` flags exist for faster local iteration; CI and release runs use the full path.
- Known non-fatal warning classes (intentional `NUXT_B3011` duplicate-name override warning, Vue slot/readonly warnings, og:image/twitter:card deprecations, remote Shiki resources) are tracked in [project status](./project-status.md).
