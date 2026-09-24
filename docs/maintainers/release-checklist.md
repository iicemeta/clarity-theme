# Release Checklist

**English** | [简体中文](./release-checklist.zh-CN.md)

Version-agnostic template for cutting a release. Copy it into the release PR/issue and tick the boxes there; **do not record release-specific evidence (counts, timestamps, commit hashes) in this file** — that belongs in the [CHANGELOG](../../CHANGELOG.md) or the GitHub Release. The process narrative lives in [publishing](./publishing.md).

## Pre-release

- [ ] Working tree clean; release branch/commit identified.
- [ ] No open release-blocking roadmap item for this release class.
- [ ] Upstream baseline reviewed (`pnpm sync:check`); drift either absent or explicitly handled.
- [ ] All `REVIEW`-class decisions for included changes are resolved.

## Package metadata

- [ ] `version` bumped in `package.json` (and `create-clarity-theme/package.json` for creator releases).
- [ ] `create-clarity-theme/templates/default/package.json` declares exactly `^<version>` for the Theme release being cut (drift enforced by `pnpm release:check`).
- [ ] Exports / files / engines / peerDependencies contract unchanged or intentionally updated with tests.

## CHANGELOG

- [ ] New `## <version> - YYYY-MM-DD` entry added at the top (descending order).
- [ ] Entry covers Added / Changed / Fixed / Breaking Changes / Migration Notes for consumers.
- [ ] Creator changes recorded in `create-clarity-theme/CHANGELOG.md` instead.
- [ ] `pnpm docs:check` passes (no release-version pollution outside the changelog).

## Tests

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm verify`
- [ ] `pnpm test:sync`
- [ ] `pnpm test:migration`
- [ ] `pnpm test:contract`
- [ ] `pnpm peers check`
- [ ] `pnpm generate`
- [ ] `pnpm test:consumer`
- [ ] `pnpm test:compatibility`
- [ ] Creator release additionally: `pnpm test:create` · `pnpm test:create:e2e` · `pnpm test:create:tarball`

## Release gate

- [ ] `pnpm release:check --allow-untagged` passes on the release commit (before tagging).
- [ ] `pnpm pack --dry-run` boundary inspected; no content/, dev assets, site config, secrets, or upstream-private site data (public upstream example content retained by the parity gate is allowed and surfaced by the creator notice).

## Tag and GitHub Release

- [ ] Tag `v<version>` (creator: `create-v<version>`) points at the verified commit and is pushed.
- [ ] GitHub Release drafted on that tag with the changelog entry as the body.

## Publish (OIDC)

- [ ] Publish workflow triggered only by publishing the GitHub Release.
- [ ] Workflow tag/version validation passed.
- [ ] Full ordered suite re-ran green on the exact tag.
- [ ] Final tarball packed to `artifacts/`, audited, checksummed, and dry-run published.
- [ ] npm publish ran with `--provenance` via Trusted Publishing (no NPM_TOKEN).

## npm verification

- [ ] `npm view <package>@<version> version dist.tarball dist.integrity` matches expectations.
- [ ] Theme: `pnpm test:registry-consumer` passes against the published registry version.
- [ ] Creator: `npx create-clarity-theme@<dist-tag> --help` works from a clean environment.
- [ ] Provenance signature present/verified.

## Registry consumer

- [ ] A clean temporary consumer installs the published version and typechecks/generates successfully.
- [ ] Documented quick-start path works against the registry artifact (not a local tarball).

## Post-release audit

- [ ] Changelog/GitHub Release consistent; no follow-up corrections needed.
- [ ] Roadmap updated: completed items removed, newly discovered work added to the right horizon.
- [ ] Creator template consuming the new Theme range verified when applicable.
- [ ] Any release incident recorded in the changelog entry (or history for long-form context).

## Hotfix shortcut

For a hotfix, follow [publishing §hotfix](./publishing.md#9-hotfix-release): branch from the release tag, minimal fix + test, bump `<version>`, changelog entry, rerun the ordered suite, then tag and publish as usual. Do not skip the gate because the change is small.
