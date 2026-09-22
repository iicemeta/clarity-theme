# Publishing

**English** | [简体中文](./PUBLISHING.zh-CN.md)

This document describes how Clarity Theme is versioned, validated, and
published to npm with provenance. The intended reader is the package
maintainer.

## 1. Release prerequisites

Before creating a release:

1. Every [ROADMAP](./ROADMAP.md) P0 item is resolved; P1/P2 items are either
   completed or explicitly deferred in the release notes.
2. The full ordered verification suite passes on the exact release commit
   (see [RELEASE-CHECKLIST](./RELEASE-CHECKLIST.md)).
3. `pnpm release:check` passes. On the tagged release commit it validates the
   tag/version contract; before tagging you may run
   `pnpm release:check --allow-untagged`.
4. The npm package name situation is confirmed (see §6 below — the name
   `clarity-theme` has a previous unpublished tombstone).

## 2. Versioning

- `package.json` is the single source of truth for the version.
- The project follows [SemVer](https://semver.org/) from `0.1.0` onward.
- The first release is `0.1.0`. Fixes bump the patch version (`0.1.1`);
   breaking contract changes bump the minor (`0.2.0`) while pre-1.0, and the
   major (`1.0.0`) once the public API is declared stable.

## 3. Changelog

- Every release adds a `## <version> - YYYY-MM-DD` entry to
   [CHANGELOG.md](../CHANGELOG.md).
- The changelog is written for Theme consumers: what they can install, what
   changed in behavior, and what to check when upgrading. Internal development
   logs stay out.
- `pnpm release:check` requires a changelog entry for the package version.

## 4. Tag naming

- Git tags use `v<version>`, for example `v0.1.0`.
- **npm package version + Git tag + GitHub Release must all use the same
  version.** The publish workflow refuses to run when the release tag does not
  equal `v${package.json version}`.
- Tag the exact commit that passed the ordered verification suite:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 5. GitHub Release

1. Draft a GitHub Release on the tag (`v0.1.1`) using the release-notes
   template ([RELEASE-NOTES-0.1.1](./RELEASE-NOTES-0.1.1.md) is the filled
   example for the gated first release;
   [RELEASE-NOTES-0.1.0](./RELEASE-NOTES-0.1.0.md) documents the out-of-band
   `0.1.0` artifact).
2. Publishing the Release triggers the `publish.yml` workflow. The workflow
   checks out the tag, verifies the tag/version contract, reruns the complete
   ordered validation suite, packs `artifacts/clarity-theme-<version>.tgz`,
   audits and dry-runs that exact tarball, and finally publishes it.
3. Do not publish on branch pushes. GitHub Release exists precisely as the
   human confirmation step.

## 6. Trusted Publisher (one-time manual setup)

The workflow uses npm **Trusted Publishing (OIDC)**. It stores no `NPM_TOKEN`
and no long-lived credentials are written to GitHub secrets.

A maintainer must configure this once on the npm website:

| Setting | Value |
| --- | --- |
| User/Organization | `iicemeta` |
| Repository | `clarity-theme` |
| Workflow filename | `publish.yml` |
| Registry | `npmjs.org` |
| Environment | `npm` (optional, for release approvals) |

### npm package name and version status (verified 2026-09-22)

Registry state verified during the 2026-09-22 release work:

- The name was previously published as `0.0.10` and unpublished on 2025-10-16.
- **`clarity-theme@0.1.0` was published out-of-band at 2026-09-22T07:28:22Z**
  by `creampack <creampack@iicemeta.com>` from gitHead `5a03778` — the
  pre-P0-fix tree, outside the release workflow, without provenance
  attestations.
- `pnpm test:registry-consumer` against that published `0.1.0` **fails
  typecheck inside the published package** (`server/api/stats.get.ts`
  `orWhere` void-return and `app/pages/link.vue` `never[]` feed typing); both
  defects are fixed in this repository.

Required maintainer decisions before the next release:

1. Confirm who published `0.1.0` and whether that publication was intended.
2. Decide the next version: npm forbids republishing `0.1.0`, so the
   corrected, gated release must be **`0.1.1`** (bump `package.json`,
   `CHANGELOG.md`, and the release notes, then tag `v0.1.1`).
3. Optionally `npm deprecate clarity-theme@0.1.0` with a pointer to `0.1.1`.
   **Do not unpublish** — published versions are treated as immutable.
4. Trusted Publisher configuration remains required for workflow publishing.

## 7. npm provenance

- The workflow publishes with `--provenance` over OIDC. npm generates a
  signed provenance statement bound to the repository, workflow, and commit.
- Verify after publishing:

```bash
npm view clarity-theme@0.1.0 dist.integrity
npm audit signatures --package-lock-only 2>/dev/null || true
```

- Provenance requires publishing from the GitHub workflow; local
  `npm publish` does not produce it.

## 8. Publish workflow

[`publish.yml`](../.github/workflows/publish.yml):

1. Triggers only on `release: published` (manual confirmation).
2. Checks out the release tag (`fetch-depth: 0`) and verifies
   tag = `v${package.json version}`.
3. Resolves Node from `engines.node` and pnpm from `packageManager`.
4. Runs the full ordered suite **serially**: lint → typecheck → verify →
   test:sync → test:migration → test:contract → peers check → generate →
   test:consumer → test:compatibility → release:check.
5. Packs the final tarball into `artifacts/`, audits its contents, records
   the SHA-256 checksum, and runs `npm publish --dry-run`.
6. Publishes that same audited tarball with `npm publish --access public
   --provenance`.

Permissions are minimal: `contents: read`, `id-token: write`.

## 9. Release verification

After the workflow succeeds:

```bash
npm view clarity-theme@0.1.0 version dist.tarball
pnpm test:registry-consumer
```

`test:registry-consumer` creates a temporary consumer, installs
`clarity-theme@<version>` **from the npm registry** (no local tarball), and
runs exports smoke, typecheck, static generation, and output assertions. This
completes the three consumption layers:

```text
Workspace → Tarball (test:consumer) → Registry (test:registry-consumer)
```

## 10. Rollback / unpublish policy

**Never automatically unpublish.** Published npm versions are treated as
immutable.

- A defective `0.1.0` is fixed by releasing `0.1.1`.
- A breaking mistake becomes the next semver-appropriate release.
- Rollback means: revert or fix on Git, then cut a patch release; adjust or
  close the GitHub Release as needed.
- Unpublishing is a last resort for legal/compromise takedowns only and is
  always a manual maintainer decision.

## 11. Hotfix release

1. Branch from the release tag (`git switch -c hotfix/0.1.1 v0.1.0`) or fix
   on `master` if the release is the current head.
2. Apply the minimal fix plus its test.
3. Bump `package.json` to `0.1.1`, add the changelog entry.
4. Rerun the ordered verification suite on the exact hotfix commit.
5. Tag `v0.1.1`, push, and publish through a GitHub Release as usual.

## 12. Pre-releases

- Use SemVer pre-release identifiers: `0.2.0-rc.1`, `0.2.0-beta.3`.
- Tag them normally (`v0.2.0-rc.1`) and keep the tag/version contract.
- npm marks pre-release versions as `dist-tag=next` candidates; the publish
   command may add `--tag next` for non-`latest` channels.
- Document in the release notes that pre-releases are not covered by the
  stability promises.
