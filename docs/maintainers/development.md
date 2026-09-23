# Development

**English** | [简体中文](./development.zh-CN.md)

How to work on the Clarity Theme repository itself. Command source of truth: `package.json` scripts, `pnpm-workspace.yaml`, and `.github/workflows/**`.

## Repository layout

```text
clarity-theme/
├─ src/                  # Theme runtime source (Layer srcDir; everything npm ships)
│  ├─ assets/ components/ composables/ layouts/ middleware/
│  ├─ pages/ plugins/ stores/ types/ utils/
│  ├─ app.config.ts app.vue error.vue shiki.config.ts
│  ├─ config/            # config API sources (npm ./config ./content ./schema)
│  ├─ img/               # img API sources (npm ./img)
│  ├─ modules/           # clarity-source-layout + clarity-config modules
│  ├─ public/ server/ shared/ remark-plugins/
├─ create-clarity-theme/ # Independent npm creator package (own version + changelog)
├─ skills/               # Agent workflow skills (not part of the npm package)
├─ docs/                 # Bilingual documentation (see documentation rules)
├─ playground/           # Workspace-linked development consumer
├─ scripts/ tests/       # Verification and tooling
├─ .github/workflows/    # CI, publish, and upstream-sync workflows
└─ nuxt.config.ts, package.json, sync-manifest.json, …
```

`nuxt.config.ts` stays at the package root. Its first module, `src/modules/clarity-source-layout`, applies the `src/` directory metadata to the Clarity layer only; static `srcDir`/`serverDir`/`dir.*` values are not used because c12 would merge them into consumer root config. npm, Git-commit, and local-directory installs therefore resolve the same layout without overriding a consumer's own application directories.

The npm package, the Agent skill, and the docs are three separate concerns:

- **`clarity-theme` (npm package)** — the runtime Nuxt Layer installed with `extends: ['clarity-theme']`. Its `files` field ships only `src/` plus the root entry files; dev assets never enter the tarball.
- **`skills/migrate-blog-v3-to-clarity`** — the canonical Agent workflow for migrating an existing blog-v3 project. It is versioned with the repository but intentionally **not** bundled into the npm package.
- **`docs/`** — human documentation mirrored in English and Chinese.

## Setup

```bash
pnpm install   # Theme + playground + creator workspace
```

Node must satisfy `engines.node`; pnpm is read from `packageManager`. The pnpm workspace exists only for this repository's development (playground and creator tests) — consumers do not need a workspace.

## Daily commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Playground dev server |
| `pnpm build` / `pnpm generate` | Playground build / static generation |
| `pnpm lint` / `pnpm lint:fix` | ESLint + Stylelint (includes Markdown) |
| `pnpm typecheck` | Playground `nuxt typecheck` |
| `pnpm docs:check` | Documentation governance checks (see below) |

## Verification commands

See [testing](./testing.md) for the full matrix and when to run each layer.

```bash
pnpm verify                # Theme purity/static leak checks
pnpm peers check           # Peer dependency audit
pnpm test:sync             # Upstream-sync tool regression
pnpm test:migration        # Migration skill + fixture regression
pnpm test:contract         # Compatibility contract + generated doc sync
pnpm test:consumer         # Real packed-tarball consumer
pnpm test:compatibility    # SSR + real browser + dev hydration
pnpm test:create           # Creator CLI tests
pnpm test:create:e2e       # Generated consumer E2E
pnpm test:create:tarball   # Packed creator tarball E2E
pnpm test:registry-consumer # Post-release registry consumer (published version)
pnpm release:check         # Release gate (see publishing)
pnpm pack --dry-run        # Inspect the npm tarball without writing it
```

## Upstream synchronization

The Theme records its reviewed upstream baseline in `sync-manifest.json` and never auto-merges:

```bash
pnpm sync:check   # compare manifest baseline with remote
pnpm sync:diff    # classify upstream changes
pnpm sync:apply   # transactionally apply reviewed include-only changes
pnpm sync:verify  # rerun Theme purity and baseline checks
```

Details, conflict semantics, and the weekly read-only drift workflow are in [upstream sync](./upstream-sync.md).

## Documentation changes

Documentation lives under `docs/` with an audience-based structure and bilingual pairing; release versions are documented only in `CHANGELOG.md`. Before committing doc changes run `pnpm docs:check`; the rules themselves are in [documentation rules](./documentation.md).

## CI

CI derives Node and pnpm versions from package metadata. It runs lint/typecheck/verify/sync/migration/contract/peers on the fixed Node matrix, then playground generate, real consumer acceptance, and rendering compatibility on the primary Node version. A separate weekly workflow only detects and reports upstream drift. Exact job wiring: `.github/workflows/ci.yml` and `.github/workflows/sync.yml`.
