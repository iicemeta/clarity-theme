# Release Notes — v0.1.2

> Template for the `v0.1.2` GitHub Release. Keep npm package version, Git
> tag, and GitHub Release version identical.

## Release body

### Highlights

- Source-layout release: all runtime theme source now lives under the
  standardized `src/` directory, with no runtime source directory left at
  the repository root.
- A layer-only `clarity-source-layout` bootstrap module applies the `src/`
  layout to the Clarity layer only. npm, Git-commit, and local-directory
  installs resolve the same layout without overriding a consumer's own
  application directories.
- The five public package exports (`.`, `./config`, `./content`,
  `./schema`, `./img`) are unchanged; they now resolve into `src/`.
- Upstream sync mapping, the migration Skill, and regression tests were
  updated together with the new layout.

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

### Compatibility

- Node `^22.19 || ^24.11 || >=26`, pnpm 12.4.1 or compatible.
- Nuxt `^4.5.2`, Vue `^3.5.42`, Nuxt Content `^3.16.0`.
- Verified layers: workspace generation, independent tarball consumer,
  production SSR, real-browser rendering, dev hydration, purity, peer,
  contract, and upstream-sync checks.

### Known limitations

- Unchanged from `0.1.1`: `plain-shiki` scope rendering needs the
  documented consumer patch; remote CSS/font origins use built-in defaults;
  upstream-derived `app/stores|types|utils` paths still need manual sync
  classification; `site.author.email` remains public metadata; the
  `NUXT_B3011` duplicate-name warning is expected for same-path component
  overrides.

### Upgrade notes

- From `0.1.1`: no action is required. `extends: ['clarity-theme']` and the
  documented exports keep working; internal package paths now start with
  `src/`.
- If you referenced unpublished internal theme paths, update them to the
  `src/` equivalents documented in [Customization](./CUSTOMIZATION.md).
- From the broken `0.1.0` registry artifact: upgrade to `0.1.2`; the older
  artifact fails typecheck inside the published package.
- Review the [Configuration](./CONFIGURATION.md) and [API](./API.md) docs
  for the v0.1 contract.
- See [CHANGELOG](../CHANGELOG.md) for the complete change list and
  [COMPATIBILITY](./COMPATIBILITY.md) for the verified matrix.
