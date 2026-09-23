# Migration Validation

Validation is serial. Do not start multiple dev/build/test processes over the same tree.

## Consumer commands

```bash
git status --short --branch
pnpm install
pnpm typecheck
pnpm generate
```

If `typecheck` is not a script:

```bash
pnpm exec nuxt typecheck
```

Then run all relevant existing project commands, for example lint, content checks, feed checks, unit tests, screenshots, and deployment preview.

## Minimum success criteria

1. Starting branch/HEAD and all approved changes are recorded.
2. `pnpm install` exits zero and the lockfile diff only reflects approved dependency/patch changes.
3. Typecheck exits zero.
4. Static generation exits zero.
5. No required `REVIEW` item remains unresolved.
6. No `NEVER_TOUCH` file appears in the final diff.
7. Migration report lists every created, modified, deleted, and retained file/classification.

## Required route and output checks

Choose representative entries for each category present in the site:

- home page and each pagination branch
- newest and oldest articles
- custom permalink and file-routed article
- draft/preview behavior where used
- article with local and remote images
- article with code, tabs, math, Mermaid, ABC music, and MDC components
- archive, friends, search, TOC, theme toggle, and 404
- every redirect class and custom route rule
- every custom server route
- Atom when `features.atom` is enabled
- OPML when `features.opml` is enabled
- stats JSON/widget when `features.stats` is enabled
- robots, sitemap, LLMs, favicon, and canonical URLs
- Twikoo and each analytics script when configured
- custom component overrides
- light, dark, and system themes
- mobile and desktop layouts
- SSR HTML and hydrated client behavior

## Exact assertions by asset

| Asset | Success standard |
| --- | --- |
| `content/**` | Git diff shows no edits; representative routes and metadata render |
| frontmatter | No semantic edits; custom permalinks still resolve |
| `public/**` | No deletions; asset URLs return expected status/type |
| `feeds.ts` | Friend page and OPML contain approved entries; no self-feed duplication |
| `redirects.json` | File unchanged; representative redirects use approved status/target |
| patches | Required patches registered, lockfile resolves, targeted behavior passes |
| custom components | Intentional overrides render; no generic component tree copied wholesale |
| custom Shiki | Light/dark themes load; code rendering and hydration pass |
| custom modules/plugins | Registered once; no duplicate Layer behavior |
| custom server | Routes respond as before; collisions explicitly adjudicated |
| Twikoo | Loader script and `envId` both present; `#twikoo` initializes |
| stats | JSON/widget values match the configured include scope; multiple patterns form a union |
| feature flags | Disabled outputs are absent; enabled outputs and links are present |

## Theme repository checks

When changing Clarity's migration contract, also run from the Theme repository:

```bash
pnpm test:migration
pnpm test:compatibility
```

For a full release candidate, use the ordered suite in `docs/maintainers/release-checklist.md`.

## Failure handling

- Record every failing command, exit code, relevant error, and whether it predated migration.
- Do not mark migration complete while a required command fails.
- Restore or preserve uncertain user files rather than deleting them to make a test pass.
- Re-run the full serial command set after any dependency, patch, route, or Content configuration change.
