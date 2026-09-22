# Release Audit

**English** | [简体中文](./RELEASE-AUDIT.zh-CN.md)

> Audit date: 2026-09-22, Asia/Taipei. This is a read-only engineering audit for the release-closing phase. It records the repository state before the documentation, migration-skill, and release-checklist work; it does not redesign the Theme Layer or change runtime code.

## 1. Audited Baseline

| Item | Result |
| --- | --- |
| Repository | `iicemeta/clarity-theme` |
| Branch | `master`, tracking `origin/master` |
| Theme HEAD at audit start | `f370ef4` (`docs: establish phase 20 roadmap`) |
| Theme working tree | Clean before this report was written |
| Package | `clarity-theme` v0.1.0, MIT |
| Runtime contract | Node `^22.19 \|\| ^24.11 \|\| >=26`, pnpm `12.4.1`, Nuxt peer `^4.5.2`, Vue peer `^3.5.42` |
| Upstream | The blog-v3 repository recorded in `sync-manifest.json`, branch `main` |
| Upstream HEAD | `f6ea97d745517feb52f0c100e89acb36f0adc12f` (`fix: 修复静态页面侧栏重复与快捷键水合不匹配`) |
| Upstream package version | 3.7.2 |
| Manifest baseline | Matches the upstream commit and version in `sync-manifest.json` |
| Local upstream tree | Clean and checked out at the manifest commit |

The upstream working copy used for this audit is outside the Theme Git repository. It is a read-only reference and is not a release artifact.

## 2. Current Completed Work

### 2.1 Package and Layer boundary

- The Theme is a Nuxt 4 Layer rooted at `nuxt.config.ts`.
- `package.json` exposes five entries: Layer root, `./config`, `./content`, `./img`, and `./schema`.
- The package payload excludes user content, playground, documentation, CI, tests, sync manifest, and consumer patches.
- Development and runtime dependencies are separated; Nuxt and Vue are peer dependencies.
- `scripts/test-consumer.mjs` exercises a real packed tarball and independent installation rather than only a workspace link.

### 2.2 Configuration contract

- `clarity.config.ts` is loaded by `modules/clarity-config`.
- Zod strict schemas validate site, article, feed, stats, integration, feature, and changelog groups; unknown fields fail the build.
- `defineClarityConfig()` and generated declaration files are exported through `clarity-theme/config`.
- `createClarityContentConfig()` derives the Content collection and article schema from resolved Clarity configuration.
- Consumer `app/app.config.ts` is intentionally limited to UI overrides under `clarity.component`, `clarity.footer`, `clarity.header`, `clarity.link`, `clarity.nav`, `clarity.pagination`, and `clarity.themes`.
- The module warns when site-level fields are incorrectly placed in consumer app config.

### 2.3 Consumer-owned data

- Articles and other Content sources remain in the consumer's `content/` directory.
- Friend data remains in a consumer-owned `feeds.ts`; absence falls back to empty data with a warning.
- Redirects, deployment configuration, runtime secrets, custom modules, custom server routes, and package patches are outside the Theme payload.
- The current Theme package has no patch directory and no concrete upstream articles, friend data, analytics identifiers, or private credentials.

### 2.4 Rendering and output features

The Layer currently provides generic UI, layouts, pages, components, styles, composables, stores, Markdown/MDC rendering, Shiki, math, Mermaid, ABC music, rich images, search, pagination, archive, TOC, Twikoo integration points, Atom, OPML, statistics, robots, sitemap, and LLMs outputs.

### 2.5 Upstream synchronization

- `sync-manifest.json` records the exact upstream repository, branch, commit, version, framework versions, and sync time.
- It distinguishes `include`, `exclude`, `transform`, and `manual` paths; unmatched paths are treated as unknown and block apply.
- `scripts/sync-upstream.mjs` implements check, diff, transactional apply, and verify modes.
- Apply requires a clean Theme tree, only fast-forwards unmodified include files, blocks conflicts, and rolls back on verification or manifest failure.
- The known boundary gap is that several upstream-derived paths under `app/stores/**`, `app/types/**`, and `app/utils/**` are not explicitly classified.

### 2.6 Patch boundary

The upstream has five patch files, while four are registered in `pnpm-workspace.yaml`:

- `@nuxtjs/mdc`: required for upstream-content tab preservation; the Theme now owns inline-code compatibility, but the detab-only patch remains consumer-owned.
- `@nuxt/image`: required for fractional-density strings used by current upstream content; consumer patch or upstream fix.
- `plain-shiki`: short-term consumer patch; a future Theme-side public selector option may remove it.
- `ipx`: optional ICO passthrough recipe, not a general Theme requirement.
- `@vue/shared`: exists as a file but is not registered; it is inactive and must not be copied or enabled.

The Theme intentionally carries none of these patches.

## 3. Existing Verification

### 3.1 Declared commands

| Command | Actual coverage |
| --- | --- |
| `pnpm lint` | ESLint plus Stylelint for Theme and playground Vue/SCSS |
| `pnpm typecheck` | Playground `nuxt typecheck`, including generated Layer and app-config types |
| `pnpm verify` | Static purity, forbidden identity/site data, package boundary, and import checks |
| `pnpm test:sync` | Node test suite with temporary Git repositories for sync operations and rollback |
| `pnpm test:contract` | Contract rows and feature references synchronized with generated compatibility documentation |
| `pnpm generate` | Playground static generation through the workspace Layer link |
| `pnpm test:consumer` | Pack audit, export/type graph, independent install, smoke/typecheck, and three generate variants |
| `pnpm test:compatibility` | Contract, production build scan, SSR, real-browser, and dev-hydration checks |
| `pnpm sync:check` / `sync:diff` / `sync:apply` / `sync:verify` | Upstream drift and transactional synchronization |
| `pnpm test:release` | Ordered shorthand for verify, real consumer, and compatibility |
| `pnpm peers check` | Workspace peer dependency audit |

### 3.2 CI

- `ci.yml` runs a three-layer ordered pipeline: static/regression on the Node matrix, playground generation, then real consumer and rendering compatibility.
- Node and pnpm versions derive from package metadata.
- `sync.yml` runs weekly and only detects/reports upstream drift; it never applies or pushes changes.

### 3.3 Evidence status

The status document records a full suite pass on an earlier code-equivalent commit and only partial reruns at the Phase 20 documentation HEAD. Therefore, **a complete ordered run on the final release commit is still required**. Results recorded in prose are not a substitute for that final run.

## 4. Not Yet Complete

1. **P0-1 — Server/client configuration split:** server-consumed feed/stats and build-only article fields remain visible through appConfig.
2. **P0-2 — Feature-off route semantics:** disabled Atom/OPML/stats routes are removed from prerender configuration, but runtime 404 behavior is not asserted.
3. **P0-3 — Anti-mirror correctness:** injection is tested, but navigation behavior is unverified and the inherited assignment to `location.host` is suspected malformed.
4. **P0-4 — Random permalink contract:** `article.useRandomPermalink` is accepted but does not generate permalinks; it must be removed or explicitly relocated to a documented build-scaffolding API before first release.
5. **P1 correctness and compatibility debt:** multi-pattern stats currently behaves as an intersection although the configuration reads as a union; remote CSS/font origins are fixed; sync classification is incomplete; TypeScript/MJS parity is not gated; and the short-term `plain-shiki` patch strategy is not yet eliminated.
6. **Release workflow:** first npm version/tag/provenance/dry-run/rollback procedure is not defined.
7. **Migration documentation:** no complete user-facing migration guide exists.
8. **Configuration guide:** field documentation exists as `docs/configuration.md`, but the requested user-facing `docs/CONFIGURATION.md` entry and naming are not established.
9. **Customization guide:** no consolidated public override guide exists.
10. **Agent migration skill:** `.agents/skills/migrate-blog-v3-to-clarity/` does not exist.
11. **Migration fixture/regression:** no fake blog-v3 consumer fixture validates migration mappings, classifications, redirects, patches, component overrides, or custom Shiki behavior.
12. **Exact-commit release verification:** final ordered suite and release checklist have not yet been generated.

## 5. README Versus Current Reality

The current README is already substantially user-facing and contains no `YOURNAME` placeholder, obsolete upstream version, or stale Phase 0–6 TODO list. Remaining inconsistencies or gaps are:

1. It claims broad verification without qualifying that the last complete suite ran on an earlier code-equivalent commit rather than current HEAD.
2. Quick Start recommends `pnpm add -D`; a Nuxt Layer is normally a runtime dependency, so release guidance should use a regular dependency unless a documented dev-only position is intentionally chosen.
3. It does not link a migration guide because that guide does not yet exist.
4. It links lowercase `docs/configuration.md`; the requested public entry is uppercase `docs/CONFIGURATION.md`.
5. It has no consolidated customization entry beyond short README snippets.
6. “Current Status” is written around the internal Phase 20 roadmap rather than concise release readiness for Theme users.
7. The feature list mentions anti-mirror without its known pre-release correctness limitation.
8. Documentation and test command lists do not yet include migration/fixture checks that this phase must add.

## 6. Documentation Gaps

- `docs/MIGRATION.md`: absent.
- `docs/CONFIGURATION.md`: requested canonical entry absent; existing lowercase document is more contract-oriented than user walkthrough.
- `docs/CUSTOMIZATION.md`: absent.
- `docs/RELEASE-CHECKLIST.md`: absent.
- Migration-specific mapping from upstream `blog.config.ts`, `app/app.config.ts`, `content.config.ts`, `nuxt.config.ts`, `app/feeds.ts`, `redirects.json`, patches, custom components, and server code is not consolidated.
- Existing docs correctly identify technical debt, but users need a separation between “Theme API migration” and “known release blockers”.
- Historical audit documents remain useful but should stay clearly marked as non-authoritative; they should not become the primary migration path.

## 7. Migration Gaps

The upstream configuration shape has been audited, but no safe operational procedure is currently packaged for users or agents:

- Upstream root-level identity fields need mapping into `site.*`.
- Upstream `article`, `feed`, and `stats` need movement into their Clarity groups.
- Upstream `scripts` and `twikoo` need movement into `integrations.*`.
- Output switches need explicit `features.*` documentation.
- Upstream app config must stop spreading the entire `blog.config`; only UI groups may remain under `clarity`.
- Upstream Content config must be replaced by `createClarityContentConfig(clarityConfig)`.
- Consumer `feeds.ts` should remove the self-feed export and site-specific helper usage where possible; only friend groups belong in this file.
- Redirects must remain consumer-owned and continue to be transformed into route rules.
- Custom modules, plugins, server routes, runtime config, deployment settings, and prerender routes need inventory and review rather than deletion.
- Patches must remain in the consumer package-manager configuration.
- Custom components and Shiki configuration must be preserved through same-path override rules.
- No fixture currently proves these rules against the real Theme API.

## 8. Agent Skill Gaps

No `.agents/skills/migrate-blog-v3-to-clarity/` skill exists. Required missing assets are:

- standards-compliant `SKILL.md` with the specified name/description frontmatter;
- discovery, inventory, classification, plan, apply, validation, report, and rollback workflow;
- `references/migration-map.md`;
- `references/config-mapping.md`;
- `references/validation.md`;
- deterministic fixture scenarios for minimal blog-v3, Twikoo, stats/feed, redirects, patches, consumer component override, and custom Shiki;
- static rule checks that prevent destructive changes to content, frontmatter, public assets, redirects, patches, unknown modules, and server code.

## 9. Release-Blocking Items

Before the first public package release, the following must be complete:

1. Resolve or explicitly defer with release notes all ROADMAP P0 correctness items.
2. Complete user migration, configuration, and customization documentation.
3. Add the migration Skill and knowledge references.
4. Add repeatable migration fixture/static validation.
5. Run the complete ordered verification suite on the exact release commit.
6. Run a real tarball install and npm publish dry run.
7. Define package version/tag, changelog, provenance, and rollback.
8. Confirm upstream baseline freshness or document the reviewed delta.
9. Confirm package exports, files, license, author metadata, and privacy leakage checks.
10. Generate and review `docs/RELEASE-CHECKLIST.md`.

Documentation and Skill completion are release-closing work, but they do not by themselves replace the P0 correctness gate.

## 10. Optional Enhancements

- Add a machine-readable migration inventory template.
- Extend fixture validation from static classification to a generated temporary consumer and typecheck/generate run.
- Add a dedicated migration report format for agents.
- Add release provenance and tag automation after the P0 work is complete.
- Add targeted accessibility, responsive, interaction, and remote-service failure tests.
- Make remote CSS/font origins configurable.
- Add offline/restricted Shiki build coverage.
- Reduce intentional component-override warning noise after verifying the Nuxt API boundary.

## 11. Audit Conclusion

The Layer extraction, package boundary, configuration schema, Content factory, real-consumer test, compatibility regression, playground, CI, upstream manifest, and patch audit are substantially in place. The remaining work is correctly focused on release closure and safe migration rather than another Theme extraction.

The highest-priority next steps are documentation and migration infrastructure, followed by exact-commit verification. Known runtime P0 defects must remain explicit release blockers and must not be hidden by documentation completion.
