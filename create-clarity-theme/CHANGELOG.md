# Changelog

All notable changes to `create-clarity-theme` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
package uses [Semantic Versioning](https://semver.org/).

## 0.1.0-beta.2 - 2026-09-23

Release-candidate beta for validating the GitHub Actions npm Trusted Publishing
pipeline.

### Fixed

- Kept the npm-safe `src/cli.mjs` bin path so `npx create-clarity-theme` remains
  executable after publishing.
- Included the creator workspace importer in the root lockfile so release CI can
  install with `--frozen-lockfile`.
- Upgraded npm in the publish workflow to a Trusted Publishing-capable version.

## 0.1.0-beta.1 - 2026-09-23

Initial public **beta prerelease**. It is published with the npm `beta`
dist-tag so it does not become the default `latest` creator command.

### Added

- Initial dependency-free Node.js CLI with interactive prompts, `--yes`,
  `--help`, `--version`, site metadata options, package-manager selection,
  and `--no-install`.
- Directory-safety checks for empty, non-empty, and existing Nuxt/Clarity
  projects; template paths never overwrite an existing file.
- A generic independent Nuxt consumer template with the Clarity configuration
  contracts, one welcome article, a favicon, pnpm build-script policy, and the
  minimum tested direct dependencies.
- CLI integration tests plus real source and packed-tarball consumer E2E
  covering install, typecheck, static generation, and output assertions.

### Install

```bash
npx create-clarity-theme@beta my-blog
```
