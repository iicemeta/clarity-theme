# Release Notes — v0.1.1

> Template for the `v0.1.1` GitHub Release. Keep npm package version, Git
> tag, and GitHub Release version identical.

## Release body

### Highlights

- First gated npm release of Clarity Theme, the reusable Nuxt 4 Layer blog
  theme extracted from [blog-v3](https://github.com/L33Z22L11/blog-v3),
  published through the OIDC workflow with provenance.
- Corrects the out-of-band `0.1.0` registry artifact: it was published from
  the pre-fix tree and fails typecheck against current dependencies.
- Validated `clarity.config.ts` site configuration and a Content collection
  factory driven by that configuration.
- Server/client configuration split: feeds, full stats rules, feature route
  flags, and `site.author.email` stay server-side.
- Feature-off routes return 404 at runtime in addition to being omitted from
  static output; anti-mirror navigation is fixed and verified in a real
  browser.

### Installation

```bash
pnpm add clarity-theme
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
	extends: ['clarity-theme'],
})
```

### Migration

- Follow the [Migration guide](./MIGRATION.md) when moving an existing
  blog-v3 site. Articles, friend data, redirects, patches, deployment data,
  and secrets stay in your project.
- The agent Skill `migrate-blog-v3-to-clarity` automates inventory,
  classification, planning, apply, validation, and rollback.
- `article.useRandomPermalink` was removed before this release; random
  permalink generation belongs to your build scaffolding.
- If you installed the broken `0.1.0` artifact, upgrade to `0.1.1`.

### Compatibility

- Node `^22.19 || ^24.11 || >=26`, pnpm 12.4.1 or compatible.
- Nuxt `^4.5.2`, Vue `^3.5.42`, Nuxt Content `^3.16.0`.
- Verified layers: workspace generation, independent tarball consumer,
  production SSR, real-browser rendering, dev hydration, purity, peer,
  contract, and upstream-sync checks.

### Known limitations

- `plain-shiki` scope rendering needs the documented consumer patch until
  the upstream dependency fixes its selector behavior.
- Remote CSS/font origins currently use built-in defaults; per-origin
  configuration is planned.
- Upstream-derived `app/stores|types|utils` paths still need manual sync
  classification.
- `site.author.email` remains public metadata (HTML author meta and feeds).
- The `NUXT_B3011` duplicate-name warning is expected for same-path
  component overrides.

### Upgrade notes

- From the broken `0.1.0` registry artifact: upgrade to `0.1.1`; the older
  artifact fails typecheck inside the published package.
- From a Git-commit install: replace the GitHub dependency with the npm
  package (`pnpm add clarity-theme`) and remove the commit pin.
- Review the [Configuration](./CONFIGURATION.md) and [API](./API.md) docs
  for the v0.1 contract.
- See [CHANGELOG](../CHANGELOG.md) for the complete change list and
  [COMPATIBILITY](./COMPATIBILITY.md) for the verified matrix.
