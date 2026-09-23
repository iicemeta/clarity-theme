# Changelog

All notable changes to `create-clarity-theme` are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
package uses [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- Interactive `@clack/prompts` UX in terminals, with visible editable defaults
  and a deterministic line-prompt fallback for piped/CI stdin.
- System timezone detection (`Intl.DateTimeFormat`), an explicit `UTC`
  fallback, and `--timezone` override for interactive, `--yes`, and explicit
  option paths.
- A consumer-owned `scripts/new-blog.mjs` authoring workflow with `new-blog`
  and `new` package scripts, year-based paths, Clarity-schema frontmatter,
  collision-safe filenames, and non-interactive `--yes` support.
- CLI and E2E coverage for prompt defaults, timezone detection/fallback/
  override, cancellation, generated authoring scripts, and packed tarball
  delivery of `new-blog`.
- A creation-date `site.established` value so OPML/sitemap outputs work with
  already-published Theme versions.

### Changed

- Generated consumer scripts now include `dev:host` while remaining limited to
  consumer development and authoring; upstream maintenance scripts are not
  copied into generated projects.

## 0.1.0-beta.3 - 2026-09-23

Prerelease for retrying the GitHub Actions npm Trusted Publishing pipeline with
correct release routing and artifact paths.

### Fixed

- Restricted the Theme publish workflow to `v*` release tags so creator
  `create-v*` releases no longer start it.
- Packed the creator release tarball into the repository-level `artifacts/create`
  directory, matching the subsequent audit and npm publish steps.

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
