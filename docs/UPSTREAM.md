# Upstream Synchronization

**English** | [简体中文](./UPSTREAM.zh-CN.md)

Current source of truth: `sync-manifest.json`, `scripts/sync-upstream.mjs`, `tests/sync-upstream.test.mjs`, and `.github/workflows/sync.yml`.

## Upstream and Baseline

| Item | Value |
| --- | --- |
| Upstream project | `blog-v3` on GitHub; exact URL in `sync-manifest.json` `upstream.repo` |
| Branch | `main` |
| Baseline commit | `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| Upstream package version | 3.7.2 |
| Recorded Nuxt version | 4.5.2 |
| Recorded Content range | `^3.16.0` |
| Recorded sync time | 2026-09-21T16:40:00+08:00 |
| Current drift | None at this documentation snapshot |

The exact Git URL is not repeated throughout docs because Theme purity verification deliberately restricts where upstream identity strings may appear. README and the manifest are the authoritative display/reference locations.

## Manifest Categories

Classification priority is:

```text
exclude > transform > manual > include > unknown
```

### `pathMap`

All manifest globs and the `upstream` block describe the **upstream**
(blog-v3) tree. The optional `pathMap` object maps upstream directory prefixes
to their **local** destinations when the engine reads or writes Theme files.
Since the `src/` source-layout migration, the Theme layout differs from
upstream:

| Upstream prefix | Local prefix |
| --- | --- |
| `app/` | `src/` |
| `modules/` | `src/modules/` |
| `public/` | `src/public/` |
| `remark-plugins/` | `src/remark-plugins/` |
| `server/` | `src/server/` |
| `shared/` | `src/shared/` |

Mapping applies only at the local filesystem boundary; classification,
baseline comparison, conflict detection, and rollback semantics remain
upstream-path based. Manifests without `pathMap` keep identity mapping.

### `include`

Paths considered directly synchronizable when the Theme copy still matches the recorded baseline:

- `app/assets/**`
- `app/components/**`
- `app/composables/**`
- `app/layouts/**`
- `app/middleware/**`
- `app/pages/**`
- `app/plugins/**`
- `app/shiki.config.ts`
- `app/app.vue`
- `app/error.vue`
- `modules/**`
- `remark-plugins/**`
- `server/**`
- `shared/**`
- `public/assets/**`
- `public/fonts/**`

Most currently adapted files do not match baseline, so future upstream changes to them will conflict rather than silently overwrite Theme work.

### `exclude`

Upstream-private or non-Theme paths:

- `app/feeds.ts`
- `blog.config.ts`
- `content/**`
- `redirects.json`
- `edgeone.json`
- `scripts/**`
- `.vscode/**`

### `transform`

Derived files requiring manual redesign when upstream changes:

- `app/app.config.ts`
- `nuxt.config.ts`
- `content.config.ts`
- `package.json`
- `pnpm-workspace.yaml`

### `manual`

Theme-owned quality/config files requiring review:

- `patches/**`
- `tsconfig.json`
- `eslint.config.mjs`
- `stylelint.config.mjs`
- `cspell.json`

### `unknown`

Any changed path not matched above. Unknown changes block apply so the baseline cannot advance silently.

## Commands

| Command | Behavior |
| --- | --- |
| `pnpm sync:check` | Compare remote branch head with manifest commit; `--fail-on-update` returns status 1 on drift |
| `pnpm sync:diff` | Clone target commit, diff baseline to head, and print include/transform/manual/exclude/unknown buckets |
| `pnpm sync:apply` | Require a clean Theme tree, apply safe include operations transactionally, verify purity, then update the baseline |
| `pnpm sync:verify` | Run Theme purity verification and require the manifest baseline to equal remote head |

## Apply and Conflict Semantics

For an include change:

- Upstream new file and local path missing → copy.
- Upstream new file and local path exists → conflict; no operations apply.
- Local file hash equals baseline and upstream modifies it → fast-forward write.
- Local file differs from baseline → conflict; no operations apply.
- Upstream deletes and local equals baseline → delete.
- Upstream deletes and local differs/is missing → conflict.
- Rename is modeled as deletion of the old include path plus write of the new path.

All operations in one apply are backed up and rolled back if verification or manifest commit fails. Any conflict blocks the whole apply, preserving the old baseline. Transform/manual files are only reported.

## Baseline Semantics

The manifest baseline advances only after:

1. Unknown changes are absent.
2. No include conflict exists.
3. File operations apply successfully.
4. Theme purity verification passes.
5. The manifest can be rewritten with the new commit and timestamp.

Otherwise the previous commit remains authoritative.

## Scheduled Workflow

`.github/workflows/sync.yml` runs weekly at 03:00 UTC or manually:

1. Resolve primary Node version from `engines.node`.
2. Install pnpm from `packageManager`; no dependency install is needed.
3. Run `pnpm sync:check --fail-on-update`.
4. Reuse an open `sync` Issue if present; otherwise create one with `sync:diff` details.
5. Fail with a clear upstream-changed message.

It never runs `sync:apply`, commits, or pushes.

## Patch Relationship

The Theme package carries no package-manager patches. The differential blog consumer may hold site-level patches for upstream-content compatibility. Patches are intentionally outside the sync manifest's Theme payload and are summarized in [PATCHES](./PATCHES.md).

## Current Boundary Gaps

The manifest does not explicitly classify:

- `app/stores/**`
- `app/types/**`
- `app/utils/**`
- Theme-only documentation, CI, scripts, and tests

Some of those files are unchanged upstream files, while `app/types/article.ts` and `app/types/feed.ts` have been adapted. Future upstream changes to unlisted paths will become `unknown` and block apply. This is intentional protection but makes the manifest an incomplete map of Theme-owned versus upstream-derived paths.

No new synchronization mechanism is designed or implemented by this documentation task.
