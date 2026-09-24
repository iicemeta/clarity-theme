# Changelog

All notable changes to Clarity Theme are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## 0.1.4 - 2026-09-24

Upstream fidelity reset: Clarity is now a Layer extraction of blog-v3 with an
enforced parity gate. No public API break; the `clarity` app-config key remains
supported as a compatibility path.

### Added

- Release-contract drift gate: `pnpm release:check` now requires the creator
  template's `clarity-theme` dependency to be exactly the caret range of the
  Theme release being cut, and the creator publish workflow verifies that the
  template range resolves on npm before shipping.
- `pnpm test:upstream-parity` regression gate with
  `tests/upstream-parity.manifest.json`, recording `identical` / `mechanical` /
  `boundary` / `bugfix` difference classes per synced file (reports
  upstream/Theme baselines and per-class counts on failure).
- Theme dependency patches (`patches/`) and consumer template equivalents,
  including the `@nuxtjs/mdc` inline-code patch upstream relies on.
- `@iconify-json/devicon` dependency required by the upstream BlogTech widget.

### Changed

- Restored 46 upstream files at baseline `f6ea97d` (34 byte-identical, 12 with
  explicit mechanical import rewrites); components, layouts, pages, styles,
  composables, widgets, icons, and server routes now match blog-v3.
- Upstream components read a flat upstream-shaped `useAppConfig()`; the
  `clarity-config` module injects that shape from `clarity.config.ts` (UI
  defaults, site-derived values, and 0.1.x `clarity` overrides merged) and
  generates build-time data modules for `~~/package.json` and
  `~~/pnpm-workspace.yaml`.
- `sync-manifest.json` now includes `app/stores/**`, `app/types/**`, and
  `app/utils/**`; the migration, compatibility, consumer, and purity suites
  encode upstream behavior (Twikoo container, upstream app-config shape,
  upstream anti-mirror contract, tab-preserving code blocks).
- Upstream-attribution policy: release/purity gates no longer block the public
  upstream example content retained by the parity gate (community group, site
  log, `zhilu` icon, anti-mirror blacklist, Atom generator attribution — the
  same content upstream's own `init-project` script leaves as a reference);
  upstream-private site data (analytics IDs, tokens, private service
  endpoints) remains blocked, and `create-clarity-theme` now lists the
  retained examples after every successful creation.
- Migration and new-project documentation (EN/ZH) and the
  `migrate-blog-v3-to-clarity` Skill now state the project-initialization and
  dependency-update contracts: new blogs must use `create-clarity-theme`
  (never a hand-written `package.json`), existing blog-v3 projects keep their
  own `package.json` and update dependencies only through package-manager
  commands, a caret range such as `^0.1.3` means `>=0.1.3 <0.2.0` (not a pin),
  the lockfile records the resolved version, and lockfiles are never edited by
  hand.

### Fixed

- OPML generation now omits an entry's optional `created` attribute when the
  site or feed entry has no date, instead of failing the route for new
  consumers without `site.established`.
- `modules/anti-mirror` uses `minifySync` (upstream called the async `minify`
  synchronously, so the script never injected) and loads the generated data
  module inside `setup` so the injected URL is never stale; the module is
  registered explicitly after `clarity-config`.

### Deprecated

- `features.antiMirror` custom blacklist input: the upstream anti-mirror
  module is always on with its hard-coded blacklist; the key is kept for
  0.1.x input compatibility only.

## 0.1.3 - 2026-09-23

Documentation governance and homepage technical-information fixes.

### Added

- Added a documentation governance page and `pnpm docs:check`, a CI-enforced
  validator for release-version pollution, bilingual pairing, Markdown links,
  and changelog ordering.

### Changed

- Restructured the documentation into an audience-based wiki (`docs/getting-started`,
  `docs/guides`, `docs/reference`, `docs/concepts`, `docs/maintainers`,
  `docs/history`) with a documentation index; README is now a landing page that
  links to it instead of embedding reference material.
- Release versions are now documented only in this changelog. The per-version
  `RELEASE-NOTES-*.md` files were removed and their remaining upgrade guidance
  merged into the corresponding entries below.
- `create-clarity-theme` release history now lives exclusively in
  `create-clarity-theme/CHANGELOG.md`; this changelog only describes the Theme.
- Publishing and release-checklist documentation were rewritten as
  version-agnostic processes; historical audits moved to `docs/history/` and
  are marked non-authoritative.

### Fixed

- Restored the upstream `图片存储` and `软件协议` entries in the homepage
  `技术信息` widget, preserving the upstream ordering.

## 0.1.2 - 2026-09-22

Source-layout release, published through the `v0.1.2` tag and the OIDC
release workflow. The consumer-facing package exports and configuration
contract are unchanged from `0.1.1`.

### Changed

- All runtime theme source moved to the standardized `src/` layout: the
  former `app/`, `config/`, `img/`, `modules/`, `public/`,
  `remark-plugins/`, `server/`, and `shared/` directories now live under
  `src/`, and no runtime source directory remains at the repository root.
- A layer-only `clarity-source-layout` bootstrap module applies the `src/`
  layout metadata to the Clarity layer only, so npm, Git-commit, and
  local-directory installs resolve the same layout without overriding a
  consumer's own application directories.
- The five public exports (`.`, `./config`, `./content`, `./schema`, and
  `./img`) keep the same consumer API and now resolve into `src/`.
- Upstream sync path mapping targets `src/`, so drift detection stays
  aligned with the migrated layout.
- The migration Skill moved to `skills/migrate-blog-v3-to-clarity` at the
  repository root and its regression tests cover the new layout.

### Upgrade notes

- No action is required for consumers that use `extends: ['clarity-theme']`
  and the documented package exports.
- Consumers that referenced unpublished internal theme paths must move
  those references to the `src/` equivalents documented in
  [Customization](./docs/guides/customization.md).
- From the broken out-of-band `0.1.0` registry artifact: upgrade to this
  release; the older artifact cannot be republished.

## 0.1.1 - 2026-09-22

First gated npm release of the Theme extracted from
[L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3), published through
the `v0.1.1` tag and the OIDC release workflow. It corrects the out-of-band
`0.1.0` registry artifact described below.

### Fixed (relative to the published `0.1.0` artifact)

- `server/api/stats.get.ts` typechecks against current `@nuxt/content`
  releases (the `orWhere` group callback now returns the query group).
- Consumers without `feeds.ts` no longer hit `never[]` type inference from
  the empty-feeds fallback.
- Disabled features (`features.atom` / `opml` / `stats`) now return **404 at
  runtime** in addition to being omitted from static output.
- The anti-mirror script now navigates from a mirrored hostname back to the
  canonical host derived from `site.url`; assigning a full URL to
  `location.host` no longer breaks the redirect.
- Multi-pattern `stats.includePaths` are combined as a union (`posts/%` or
  `notes/%`), so configuring more than one content pattern no longer empties
  the statistics.
- Server-consumed configuration (`feed.*`, full `stats.*`, feature route
  flags, and `site.author.email`) moved from client-visible appConfig to a
  server-only runtime config source. Client bundles now contain only the
  rendering-required configuration subset.
- Removed the no-op `article.useRandomPermalink` configuration field. Random
  permalink generation belongs to consumer build scaffolding, not the Theme.

### Added

- **Reusable Nuxt 4 Layer packaging.** Install `clarity-theme` from npm, add it
  once through `extends: ['clarity-theme']`, and keep all site data, content,
  redirects, deployment settings, and dependency patches in your own project.
- **Public configuration API.** `clarity.config.ts` with a strict schema,
  defaults, and unknown-field rejection for site identity, article semantics,
  feeds, stats, integrations, feature flags, and the changelog widget.
- **Content schema factory.** `createClarityContentConfig()` derives the Nuxt
  Content collection schema from your Clarity configuration.
- **Five package exports.** Layer root, `./config`, `./content`, `./schema`,
  and `./img` are resolvable from an independent npm install.
- **Migration support.** A tested blog-v3 → Clarity migration guide plus the
  `migrate-blog-v3-to-clarity` agent Skill with inventory, classification,
  planning, apply, validation, and rollback rules.
- **Consumer overrides.** UI defaults through `app/app.config.ts`, same-path
  component overrides, custom Shiki themes, and custom server routes while the
  Theme stays free of site data.
- **Compatibility verification.** Ordered CI covering workspace generation,
  a real `pnpm pack` tarball consumer, production SSR, real-browser rendering,
  dev hydration, purity, peer, contract, and upstream-sync checks.
- **npm package distribution.** Release checklist, tag/version contract,
  `release:check` gate, OIDC publish workflow, provenance, and registry
  consumer test for post-release verification.

### Known limitations

- `plain-shiki` scope rendering needs the documented consumer patch until the
  upstream dependency fixes its selector behavior.
- Remote CSS/font origins (KaTeX, Inter, JetBrains Mono, Noto Serif SC) use
  the current built-in defaults; per-origin configuration is planned for a
  follow-up release.
- Upstream-derived paths under `app/stores/**`, `app/types/**`, and
  `app/utils/**` still require manual classification during upstream sync.
- The `NUXT_B3011` duplicate-name warning is expected when a consumer
  overrides a component with the same path.
- `site.author.email` remains intentionally public metadata (HTML `author`
  meta and feed output); a visibility option may arrive later.

## 0.1.0 - 2026-09-22

**Out-of-band publication record.** `clarity-theme@0.1.0` was pushed to npm
directly (gitHead `5a03778`, 2026-09-22T07:28:22Z, maintainer
`creampack <creampack@iicemeta.com>`) from the pre-fix tree, outside the
release workflow and without provenance. That registry artifact fails
typecheck against current dependencies and does not contain the fixes or the
release pipeline listed under `0.1.1`. Per the no-republish policy it stays
published; use `0.1.1` instead.
