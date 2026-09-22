# Changelog

All notable changes to Clarity Theme are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## 0.1.0 - 2026-09-22

First npm release candidate of the Theme extracted from
[L33Z22L11/blog-v3](https://github.com/L33Z22L11/blog-v3).

> **Publication note (2026-09-22):** an out-of-band `clarity-theme@0.1.0`
> was pushed to npm from the pre-fix tree (gitHead `5a03778`) before this
> gated changelog existed. That registry artifact fails typecheck against
> current dependencies and lacks provenance. All fixes below are in the
> repository; per the release policy the corrected npm version is `0.1.1`.

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

### Fixed

- Disabled features (`features.atom` / `opml` / `stats`) now return **404 at
  runtime** in addition to being omitted from static output.
- The anti-mirror script now navigates from a mirrored hostname back to the
  canonical host derived from `site.url`; assigning a full URL to
  `location.host` no longer breaks the redirect.
- Multi-pattern `stats.includePaths` are combined as a union (`posts/%` or
  `notes/%`), so configuring more than one content pattern no longer empties
  the statistics.

### Changed

- Server-consumed configuration (`feed.*`, full `stats.*`, feature route
  flags, and `site.author.email`) moved from client-visible appConfig to a
  server-only runtime config source. Client bundles now contain only the
  rendering-required configuration subset.
- Removed the no-op `article.useRandomPermalink` configuration field. Random
  permalink generation belongs to consumer build scaffolding, not the Theme.

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
