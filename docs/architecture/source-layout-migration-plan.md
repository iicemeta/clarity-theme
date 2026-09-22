# Source Layout Migration Plan

> Status: approved plan. This document records the audit and the exact move/edit
> set executed on branch `refactor/source-layout` (base `1a703eb`). This is a
> structure migration only — no Theme redesign, no behavior change, no content
> changes.

## 1. Current directory structure (before migration)

```
clarity-theme/
├─ app/                 # Nuxt application source (auto-detected srcDir by Nuxt 4)
├─ config/              # Clarity config API (npm exports: ./config ./content ./schema)
├─ img/                 # Clarity img API (npm export: ./img)
├─ modules/             # clarity-config Nuxt module
├─ public/              # theme-owned public assets (atom.xsl, fonts)
├─ remark-plugins/      # remark/rehype plugins (.mjs runtime + .ts types)
├─ server/              # server routes/utils (atom, opml, stats)
├─ shared/              # shared utils/types
├─ .agents/skills/      # migrate-blog-v3-to-clarity agent skill
├─ docs/  scripts/  tests/  playground/  .github/
└─ nuxt.config.ts, package.json, sync-manifest.json, tsconfig.json, …
```

Today the theme's `nuxt.config.ts` relies on Nuxt 4 auto-detecting `app/` as
the layer `srcDir`, while `modules/ public/ server/ shared/` are consumed from
the package root.

## 2. Target directory structure

```
clarity-theme/
├─ src/
│  ├─ assets/  components/  composables/  layouts/  middleware/
│  ├─ pages/  plugins/  stores/  types/  utils/
│  ├─ app.config.ts  app.vue  error.vue  shiki.config.ts
│  ├─ config/  img/  modules/  public/  remark-plugins/  server/  shared/
├─ skills/
│  └─ migrate-blog-v3-to-clarity/  (SKILL.md + references/)
├─ docs/  scripts/  tests/  playground/  .github/
└─ nuxt.config.ts, package.json, sync-manifest.json, tsconfig.json, …
```

Engineering-layer directories (`scripts/ tests/ playground/ docs/ skills/
.github/`) stay at the repo root and are never moved into `src/`.
`src/app/` is NOT created: `app/*` is flattened directly into `src/*`.

## 3. Nuxt 4.5 directory-resolution semantics

Verified against the installed `@nuxt/schema` 4.5.2 / `@nuxt/kit` 4.5.2:
per-layer config is normalized independently; relative values resolve against
the **layer rootDir** (the package dir containing `nuxt.config.ts`):

| Option | Resolution base | Required value after migration |
| --- | --- | --- |
| `srcDir` | layer rootDir | `'src'` |
| `serverDir` | layer rootDir (schema) / layer srcDir (kit layer dirs) | `'src/server'` |
| `dir.modules` | layer rootDir (schema; absolute after normalize) | `'src/modules'` |
| `dir.public` | layer rootDir (schema; absolute after normalize) | `'src/public'` |
| `dir.shared` | layer rootDir (consumers) | `'src/shared'` |
| `dir.app` | `resolve(srcDir, srcDir===rootDir ? 'app' : '.')` | default (`.`) is correct |

Because `srcDir !== rootDir`, `dir.app` normalizes to the srcDir itself, so
`components/ layouts/ pages/ plugins/ middleware/ assets/ app.vue …` are read
directly from `src/`.

Post-audit correction: Nuxt 4.5.2 normalizes these keys per layer, but c12
still merges statically declared layer values into a consumer root config that
does not explicitly override them. The migration therefore does **not** declare
`srcDir`/`serverDir`/`dir.*` in `nuxt.config.ts`; `src/modules/clarity-source-layout`
applies them to the Clarity layer and its cached layer-directory metadata
before other modules run.

## 4. Moves (all via `git mv`)

| From | To | Notes |
| --- | --- | --- |
| `app/*` | `src/*` | flattened (`app/components/**` → `src/components/**`) |
| `config/**` | `src/config/**` | directory moves intact |
| `img/**` | `src/img/**` | intact |
| `modules/**` | `src/modules/**` | intact |
| `public/**` | `src/public/**` | intact |
| `remark-plugins/**` | `src/remark-plugins/**` | intact |
| `server/**` | `src/server/**` | intact |
| `shared/**` | `src/shared/**` | intact |
| `.agents/skills/migrate-blog-v3-to-clarity/**` | `skills/migrate-blog-v3-to-clarity/**` | canonical skill source; no second copy left behind |

Not moved: `nuxt.config.ts`, `package.json`, `pnpm-workspace.yaml`,
`pnpm-lock.yaml`, `tsconfig.json`, `sync-manifest.json`, `scripts/`, `tests/`,
`playground/`, `docs/`, `.github/`.

## 5. Files that need edits (move is not enough)

### 5.1 `nuxt.config.ts`

- Add `src/modules/clarity-source-layout` as the first module. It assigns
  `src/`, `src/server/`, and `src/{modules,public,shared}/` to the Clarity
  layer only (including cached page/layout/middleware/plugin directories),
  preventing c12 config leakage into consumers.
- `toThemePath()` references: `app/components/**` → `src/components/**`,
  `app/assets/**` → `src/assets/**`, `modules/clarity-config` →
  `src/modules/clarity-config`.
- `pluginPath()`: `remark-plugins/` → `src/remark-plugins/`.
- `icon.customCollections` dir: `app/assets/icons` → `src/assets/icons`.
- Vite SCSS `additionalData`: `app/assets/css/_variable.scss` →
  `src/assets/css/_variable.scss`.
- `typescript.nodeTsConfig.include`: `../config/**` → `../src/config/**`,
  `../remark-plugins/**` → `../src/remark-plugins/**`.
  (See risk R5 — unchanged semantics, kept consistent with new layout.)

### 5.2 Cross-directory relative imports

Topology change: `app/*` flattens, other dirs keep their level.

| File | Old import | New import |
| --- | --- | --- |
| `src/config/app.ts` | `../app/types/nav` | `../types/nav` |
| `src/config/index.ts` | `../app/types/nav` | `../types/nav` |
| `src/config/feeds.empty.ts` | `../app/types/feed` | `../types/feed` |
| `src/img/index.ts` | `../app/utils/img` | `../utils/img` |
| `src/server/routes/subscriptions.opml.get.ts` | `../../app/types/feed` | `../../types/feed` |

All other cross-directory relative imports (`modules↔config`, `server↔shared`,
`shared↔config`, `src/types↔config/remark-plugins`, …) keep the same relative
topology under `src/` and stay unchanged.

### 5.3 `src/modules/clarity-config/index.ts` (theme path helper)

`themeDir = resolve(moduleDir, '../..')` now resolves to `src/`. Keep the
helper but rename to `themeSrcDir` and update the rooted sub-paths:

- `app/stores` → `stores`
- `app/types/index.ts` → `types/index.ts`
- `app/shiki.config.ts` → `shiki.config.ts`
- `config/app.ts`, `config/feeds.empty.ts` → unchanged (now under `src/`)

### 5.4 `package.json`

- `files`: replace the eight root dir entries (`app`, `config`, `img`,
  `modules`, `public`, `remark-plugins`, `server`, `shared`) with `src`.
- `exports` subpath keys are preserved (no breakage for consumers):
  - `./config` → `./src/config/index.{d.mts,mjs}`
  - `./content` → `./src/config/content.{d.mts,mjs}`
  - `./schema` → `./src/config/schema.{d.mts,mjs}`
  - `./img` → `./src/img/index.{d.mts,mjs}`
- `lint` / `lint:fix` globs: `app/**` → `src/**`.

### 5.5 Tooling / verification scripts

- `eslint.config.mjs`: `app/pages/**/*.vue` → `src/pages/**/*.vue`.
- `scripts/verify-theme.mjs`: forbidden file `app/feeds.ts` → `src/feeds.ts`.
- `scripts/test-consumer.mjs` + `scripts/release-check.mjs`: tarball boundary
  `allowedDirs` → `['src/']`; `requiredFiles` → `src/**` paths; declarations
  audit list → `src/config/*.d.mts`, `src/img/index.d.mts`; forbidden dev
  assets add `^skills/`.
- `scripts/sync-upstream.mjs`: minimal upstream→local path mapping (see §7).
- `tests/sync-upstream.test.mjs`: add mapping coverage (see §7).
- `tests/migration-skill.test.mjs`: skill dir `.agents/skills/…` →
  `skills/…`; theme-internal file paths → `src/…`.
- `.gitattributes`: `app/feeds.ts` linguist entry → `src/feeds.ts`.

### 5.6 Agent skill + docs

- `skills/migrate-blog-v3-to-clarity/` becomes the only copy; SKILL.md keeps
  its valid YAML frontmatter and relative references. Consumer-side
  (blog-v3) paths inside the skill are upstream semantics and are NOT
  rewritten. A short note about the Clarity `src/` layout is added.
- README.md / README.zh-CN.md and non-historical docs under `docs/`: update
  repo structure descriptions and Clarity-internal paths. Historical docs
  under `docs/history/` keep their original wording (they describe past
  states); this decision is recorded in the migration report.

## 6. Upstream paths that must NOT be rewritten

- `sync-manifest.json` `include/exclude/transform/manual` globs — they
  describe the upstream (blog-v3) tree.
- `tests/fixtures/blog-v3-consumer/**` — fixture of an upstream-shaped
  consumer project.
- Skill references' `app/**`, `modules/**`, `server/**` mentions of the
  consumer project being migrated.
- Docs quoting upstream layout when explicitly describing blog-v3.

## 7. Sync system impact (high-risk area)

Current engine (`scripts/sync-upstream.mjs`) assumes
`upstream path === local path` in `localPathFor()`, `localState()`
(`themeTrackedTree.get(path)`), and `mkdirInsideTheme()`.

Minimal mapping design (no engine rewrite):

- `sync-manifest.json` gains an optional `pathMap` object of
  `upstream prefix → local prefix` entries:

```text
{
  "pathMap": {
    "app/": "src/",
    "config/": "src/config/",
    "img/": "src/img/",
    "modules/": "src/modules/",
    "public/": "src/public/",
    "remark-plugins/": "src/remark-plugins/",
    "server/": "src/server/",
    "shared/": "src/shared/"
  }
}
```

- The engine gains one function `mapUpstreamPath(path)` applied at the
  local-path boundary only: `localPathFor`, the `themeTree` lookup key in
  `localState`, the `mkdirInsideTheme` directory, and operation reporting.
  Classification (include/exclude/transform/manual), baseline comparison,
  conflict detection, transactional apply/rollback, and verify semantics are
  unchanged. Manifests without `pathMap` behave exactly as before (identity).
- `themeTrackedTree()` is keyed by local (mapped) paths — the mapped-path
  lookup preserves "local file vs upstream baseline" comparison.
- New regression tests cover the seven required mappings (app/assets →
  src/assets, app/components → src/components, modules → src/modules,
  server → src/server, shared → src/shared, public → src/public,
  remark-plugins → src/remark-plugins), plus unmapped-path identity and
  upstream deletion via mapping.

## 8. npm package exports impact

- Public subpath keys (`.` `./config` `./content` `./img` `./schema`) are
  unchanged → zero consumer-side breakage.
- Only the files they point to move under `src/`.
- Tarball boundary shrinks from eight root dirs to `src/`; dev assets
  (`docs/ tests/ scripts/ playground/ skills/ .github/`) remain excluded and
  are explicitly forbidden by the consumer/release audits.

## 9. Validation commands (strictly serial)

```
git diff --check
pnpm install
pnpm typecheck
pnpm generate
pnpm test:sync
pnpm test:migration
pnpm test:consumer
pnpm test:contract
pnpm test:compatibility
pnpm verify
pnpm pack --dry-run
npx skills add ./skills --list
```

`pnpm test:consumer` already performs the independent-consumer check
(pnpm pack → tarball audit → isolated install → `extends: ['clarity-theme']`
→ generate ×3 variants), so it doubles as the standalone consumer proof
required by the task. Playground `dev` is exercised via `test:compatibility`
(dev-hydration phase) instead of starting a long-running server.

## 10. Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | Layer `srcDir` interaction with consumer layers | static layer values leak through c12 into consumer root config on Nuxt 4.5.2; mitigated by the first-run `clarity-source-layout` module and verified with playground + independent consumer tests |
| R2 | Hidden runtime path strings missed by import scan | full-repo rg audit for all eight prefixes; classification of every hit |
| R3 | Sync baseline silently broken | pathMap + dedicated tests; sync tests must pass before completion |
| R4 | npm tarball missing moved files | files/exports update + consumer/release tarball audits |
| R5 | `nodeTsConfig.include` entries are resolved relative to the consumer buildDir and were already dead patterns in layer context (upstream-standalone semantics) | keep the same (dead) semantics, update prefix to `../src/…`, record as REVIEW in the issues doc — no behavior regression |
| R6 | Skill discovery from repo vs GitHub | run `npx skills add ./skills --list`; GitHub discovery asserted via repo layout convention (skills/ at root) |