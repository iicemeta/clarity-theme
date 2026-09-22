# Source Layout Migration Report

> Migration branch: `refactor/source-layout` · Base / final HEAD:
> `1a703eb6152f15b801e35e5e28c58ed07e4c635f` · No commit was created.

## 1. Git boundaries

| Item | Result |
| --- | --- |
| Initial branch | `feat.src` |
| Initial HEAD | `1a703eb6152f15b801e35e5e28c58ed07e4c635f` |
| Final branch | `refactor/source-layout` |
| Final HEAD | `1a703eb6152f15b801e35e5e28c58ed07e4c635f` |
| Commit created | No — all migration work remains staged in the working tree |
| Working tree at start | Clean at the initial HEAD |
| Move commands | `git mv`; 149 moves are currently detected as Git renames |

`app/types/feed.ts` is a one-line re-export whose only content change is
`../../config/feed` → `../config/feed`. It was moved with `git mv`, but Git's
tiny-file similarity display currently represents it as `D app/types/feed.ts`
plus `A src/types/feed.ts`. No content was deleted: the re-export exists at
`src/types/feed.ts`.

## 2. Directory moves

| Source | Destination | Notes |
| --- | --- | --- |
| `app/**` | `src/**` | Flattened; `src/app/` was not created |
| `config/**` | `src/config/**` | Directory move |
| `img/**` | `src/img/**` | Directory move |
| `modules/**` | `src/modules/**` | Directory move |
| `public/**` | `src/public/**` | Directory move |
| `remark-plugins/**` | `src/remark-plugins/**` | Directory move |
| `server/**` | `src/server/**` | Directory move |
| `shared/**` | `src/shared/**` | Directory move |
| `.agents/skills/migrate-blog-v3-to-clarity/**` | `skills/migrate-blog-v3-to-clarity/**` | Canonical copy only; no duplicate remains |

No old `app/`, `config/`, `img/`, `modules/`, `public/`,
`remark-plugins/`, `server/`, `shared/`, or `.agents/` source directory remains
in the working tree.

## 3. Modified files outside moved source

- `.gitattributes`
- `README.md`, `README.zh-CN.md`
- `docs/API.md`, `docs/API.zh-CN.md`
- `docs/ARCHITECTURE.md`, `docs/ARCHITECTURE.zh-CN.md`
- `docs/CONFIGURATION.md`, `docs/CONFIGURATION.zh-CN.md`
- `docs/CUSTOMIZATION.md`, `docs/CUSTOMIZATION.zh-CN.md`
- `docs/PROJECT-STATUS.md`, `docs/PROJECT-STATUS.zh-CN.md`
- `docs/ROADMAP.md`, `docs/ROADMAP.zh-CN.md`
- `docs/UPSTREAM.md`, `docs/UPSTREAM.zh-CN.md`
- `eslint.config.mjs`
- `nuxt.config.ts`
- `package.json`, `pnpm-lock.yaml`
- `scripts/release-check.mjs`
- `scripts/sync-upstream.mjs`
- `scripts/test-consumer.mjs`
- `scripts/verify-theme.mjs`
- `sync-manifest.json`
- `tests/migration-skill.test.mjs`
- `tests/sync-upstream.test.mjs`

Moved files that also required content edits:

- `src/app.config.ts`
- `src/composables/useArticle.ts`
- `src/config/app.ts`
- `src/config/feeds.empty.ts`
- `src/config/index.ts`
- `src/img/index.ts`
- `src/modules/clarity-config/index.ts`
- `src/server/routes/subscriptions.opml.get.ts`
- `src/types/article.ts`
- `src/types/feed.ts` (shown as delete/add by tiny-file rename detection)
- `skills/migrate-blog-v3-to-clarity/SKILL.md`

Added files:

- `docs/architecture/source-layout-migration-plan.md`
- `docs/architecture/source-layout-migration-issues.md`
- `src/modules/clarity-source-layout/index.ts`

## 4. Deletions and unchanged files

There were no intentional source deletions. No article, frontmatter, redirect,
patch, unknown module, user data, or server feature was removed. The only
delete/add pair is the tiny `app/types/feed.ts` → `src/types/feed.ts` move
described above.

Exact moved-file content edits are listed in §3. Other tracked files were not
modified. The following 74 tracked paths remain unchanged:

```text
.editorconfig
.github/workflows/ci.yml
.github/workflows/publish.yml
.github/workflows/sync.yml
.gitignore
CHANGELOG.md
cspell.json
docs/COMPATIBILITY.md
docs/COMPATIBILITY.zh-CN.md
docs/config-api-audit.md
docs/config-api-audit.zh-CN.md
docs/history/2026-09-layer-extraction.md
docs/history/2026-09-layer-extraction.zh-CN.md
docs/MIGRATION.md
docs/MIGRATION.zh-CN.md
docs/patch-audit.md
docs/patch-audit.zh-CN.md
docs/PATCHES.md
docs/PATCHES.zh-CN.md
docs/PUBLISHING.md
docs/PUBLISHING.zh-CN.md
docs/RELEASE-AUDIT.md
docs/RELEASE-AUDIT.zh-CN.md
docs/RELEASE-CHECKLIST.md
docs/RELEASE-CHECKLIST.zh-CN.md
docs/RELEASE-NOTES-0.1.0.md
docs/RELEASE-NOTES-0.1.1.md
docs/theme-audit.md
docs/theme-audit.zh-CN.md
LICENSE
playground/app/app.config.ts
playground/app/components/content/Badge.vue
playground/clarity.config.ts
playground/content.config.ts
playground/content/compatibility/code.md
playground/content/compatibility/image.md
playground/content/compatibility/markdown.md
playground/content/compatibility/math.md
playground/content/compatibility/mdc.md
playground/content/compatibility/mermaid.md
playground/content/compatibility/music.md
playground/content/compatibility/routing/permalink.md
playground/content/link.md
playground/content/posts/hello-clarity.md
playground/content/posts/layer-notes.md
playground/feeds.ts
playground/nuxt.config.ts
playground/package.json
playground/public/favicon.svg
playground/tsconfig.json
pnpm-workspace.yaml
scripts/compatibility-cases.mjs
scripts/test-compatibility.mjs
scripts/test-registry-consumer.mjs
stylelint.config.mjs
tests/fixtures/blog-v3-consumer/app/app.config.ts
tests/fixtures/blog-v3-consumer/app/components/content/Badge.vue
tests/fixtures/blog-v3-consumer/app/feeds.ts
tests/fixtures/blog-v3-consumer/app/shiki.config.ts
tests/fixtures/blog-v3-consumer/blog.config.ts
tests/fixtures/blog-v3-consumer/content.config.ts
tests/fixtures/blog-v3-consumer/content/posts/example.md
tests/fixtures/blog-v3-consumer/migration-plan.json
tests/fixtures/blog-v3-consumer/modules/site/index.ts
tests/fixtures/blog-v3-consumer/nuxt.config.ts
tests/fixtures/blog-v3-consumer/package.json
tests/fixtures/blog-v3-consumer/patches/@nuxt__image.patch
tests/fixtures/blog-v3-consumer/patches/@nuxtjs__mdc.patch
tests/fixtures/blog-v3-consumer/patches/plain-shiki.patch
tests/fixtures/blog-v3-consumer/pnpm-workspace.yaml
tests/fixtures/blog-v3-consumer/public/avatar.svg
tests/fixtures/blog-v3-consumer/public/favicon.svg
tests/fixtures/blog-v3-consumer/redirects.json
tests/fixtures/blog-v3-consumer/server/api/hello.get.ts
tsconfig.json
```

## 5. `nuxt.config.ts`

- Kept the file at the package root.
- Updated package-absolute references:
  - component directories and CSS entries to `src/…`;
  - `clarity-config` module to `src/modules/clarity-config`;
  - icon collection to `src/assets/icons`;
  - SCSS variable to `src/assets/css/_variable.scss`;
  - Content remark/rehype runtime plugins to `src/remark-plugins/*.mjs`.
- Updated `typescript.nodeTsConfig.include` prefixes to `../src/config/**`
  and `../src/remark-plugins/**`.
- Did **not** statically declare `srcDir`, `serverDir`, or `dir.*`. Nuxt 4.5.2
  normalizes those keys per layer, but c12 still leaks statically declared layer
  values into consumer root config.
- Added `src/modules/clarity-source-layout` as the first module. It applies
  `src/` and all derived directories to the Clarity layer only and updates the
  cached Nuxt layer-directory metadata created before module installation.

This preserves a consumer's auto-detected `app/`, `server/`, `modules/`,
`public/`, and `shared/` directories.

## 6. `package.json`, exports, and tarball boundary

- Exports now resolve to:
  - `./src/config/index.{d.mts,mjs}`;
  - `./src/config/content.{d.mts,mjs}`;
  - `./src/img/index.{d.mts,mjs}`;
  - `./src/config/schema.{d.mts,mjs}`.
- The root export remains `./nuxt.config.ts`.
- `files` now ships the complete `src` tree plus the existing root entry files.
- ESLint/Stylelint globs use `src/**`.
- Added dev dependency `@types/mdast@^4.0.4` for the now type-checked remark
  plugin sources.
- No dependency versions were upgraded to work around migration failures.

The dry-run and release tarball contain 152 files, including
`src/modules/clarity-source-layout/index.ts`; the 30 release-required files are
present. `skills/`, `docs/`, `scripts/`, `tests/`, `playground/`, content, and
user configuration are outside the tarball.

## 7. Upstream sync manifest and engine

`sync-manifest.json` now declares `pathMap`:

```text
app/             → src/
modules/         → src/modules/
public/          → src/public/
remark-plugins/  → src/remark-plugins/
server/          → src/server/
shared/          → src/shared/
```

`include`, `exclude`, `transform`, and `manual` continue to describe upstream
(blog-v3) paths. `scripts/sync-upstream.mjs` maps only at the local filesystem
boundary:

- local write path;
- local delete/backup path;
- local `themeTree` lookup;
- directory creation;
- copied/deleted summary output.

Unmapped paths retain identity behavior. Prefix shape and traversal safety are
validated before any mode runs. Dedicated mapping tests cover flattened moves,
directory moves, deletions, conflicts, identity paths, and invalid prefixes.

## 8. Agent Skill standardization

- Moved `.agents/skills/migrate-blog-v3-to-clarity` to
  `skills/migrate-blog-v3-to-clarity` with `git mv`.
- Left exactly one canonical copy; `.agents/skills` no longer exists.
- Updated `SKILL.md` with the repository layout contract and corrected internal
  paths.
- Updated `tests/migration-skill.test.mjs` to audit `skills/`.
- Local skills CLI discovery found one skill:
  `migrate-blog-v3-to-clarity`.
- GitHub-source discovery from `iicemeta/clarity-theme` also found the same one
  skill.

## 9. README and documentation

Current README English/Chinese sections now explain:

- the engineering root versus `src/` runtime source;
- the layer-only source-layout bootstrap module;
- package/exports/tarball boundaries;
- Skill installation and migration usage;
- development, sync, test, and tarball verification commands.

Current architecture/API/configuration/customization/upstream/status/roadmap
docs were updated to `src/…` paths. Historical audit, release, publishing,
history, and changelog documents intentionally retain their original paths; see
`docs/architecture/source-layout-migration-issues.md` (R3).

## 10. Verification matrix

| Command / check | Result |
| --- | --- |
| `git diff --check` | Pass |
| `pnpm install` | Pass; lockfile updated for `@types/mdast` |
| `pnpm typecheck` | Pass |
| `pnpm generate` | Pass; 51 routes generated |
| `pnpm test:sync` | Pass; 18/18 tests |
| `pnpm test:migration` | Pass; 10/10 tests |
| `pnpm test:consumer` | All 10 stages and all variant assertions passed, then Windows temp-dir cleanup failed with `EPERM`; command exit code 1 |
| `pnpm test:contract` | Pass; 41 contract features / 40 required features |
| `pnpm test:compatibility` | First full run hit W3 timing/dev-lock races; rerun with `--no-build` passed all 52 assertion groups |
| `pnpm verify` | Pass |
| `pnpm pack --dry-run` | Pass; 152 files |
| `pnpm lint` | Pass after formatting corrections |
| `pnpm peers check` | Pass; no peer issues |
| `pnpm release:check` | Pass; 152-file tarball and all release gates |
| `npx skills add ./skills --list` | Pass; found `migrate-blog-v3-to-clarity` |
| `npx skills add iicemeta/clarity-theme --list` | Pass; found `migrate-blog-v3-to-clarity` |

Additional diagnostics:

- A config-load probe confirmed consumer root directories remain
  `playground/app`, `playground/server`, `playground/modules`,
  `playground/public`, and `playground/shared`, while the Clarity layer points
  to `src`, `src/server`, `src/modules`, `src/public`, and `src/shared`.
- An isolated consumer `nuxt build` completed successfully.
- An isolated retry of consumer `nuxt generate` completed all 43 routes.
- Full compatibility production build, production SSR service, browser checks,
  dev hydration, and anti-mirror navigation all passed on the successful rerun.

## 11. Tarball content audit

`pnpm pack --dry-run`, `pnpm test:consumer`, and `pnpm release:check` verified:

- 152 files total;
- all 30 release-required files;
- no paths outside the declared package boundary;
- no upstream site configuration;
- no upstream articles;
- no private identifiers;
- no docs/scripts/tests/playground/skills leakage;
- no duplicate Skill copy;
- runtime server routes and public assets under `src/`.

## 12. Final path audit

No old root source directory exists, and no runtime import still targets the
old root layout. Remaining textual hits were classified as one of:

- consumer paths (`playground/app/**`, `playground/public/**`, generated
  consumer fixtures in `scripts/test-consumer.mjs`);
- migration-skill consumer guidance and blog-v3 fixtures;
- upstream sync paths in `sync-manifest.json`;
- historical documents;
- ordinary URLs such as `https://vue-tippy.netlify.app/props`;
- `src/config/index.ts`'s `./app` export, which refers to `src/config/app.ts`,
  not the former root `app/` directory;
- npm lockfile package names such as `@img/*`.

A targeted alias scan found no active `~/app`, `~~/app`, `~/server`,
`#server`, or `#shared` root-source import.

## 13. REVIEW items and unresolved issues

REVIEW:

- R1 — Nuxt 4.5.2 has no public invalidation API for cached layer-directory
  metadata; `clarity-source-layout` updates that plain metadata in place after
  configuring `layer.config`.
- R2 — `typescript.nodeTsConfig.include` remains a pre-existing dead pattern in
  layer context; only prefixes were updated.
- R3 — historical documents intentionally retain old paths.

Windows-only issues recorded, not masked by unrelated rewrites:

- W1 — one intermittent Nitro prerender fast-fail with status `3221226505`;
  subsequent generate/build and the final consumer assertions passed.
- W2 — `pnpm test:consumer` exits 1 only during Windows temp cleanup after all
  validation passes (`EPERM`). This is the main remaining command-level issue.
- W3 — first compatibility run hit a Shiki timing race and Nuxt dev-lock race;
  the rerun passed all 52 assertion groups.

No deterministic Theme functionality failure remains. CI's Linux runner may
not reproduce the Windows file-lock cleanup behavior.

## 14. Final status

The structure migration is complete and functional. All deterministic source,
package, Layer, sync, Skill, docs, type, build, generate, contract, rendering,
and tarball checks pass. The command-level caveats are limited to Windows
process/temp cleanup and one non-deterministic prerender fast-fail documented
above.