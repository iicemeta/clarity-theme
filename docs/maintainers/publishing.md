# Publishing

**English** | [简体中文](./publishing.zh-CN.md)

The permanent release process for Clarity Theme. This is a runbook, not a release record: use `<version>` / `<previous-version>` placeholders, write actual release facts only in the root [CHANGELOG](../../CHANGELOG.md), and keep one-time incidents in the changelog or [history](../history). The runtime Theme and `create-clarity-theme` are independently versioned npm packages.

## 1. Release prerequisites

1. Open [roadmap](./roadmap.md) blockers for the kind of release you are cutting are resolved or explicitly deferred.
2. The working tree is clean, and you are on the commit you intend to release.
3. The full ordered verification suite passes on that exact commit (see [release checklist](./release-checklist.md)).

## 2. Versioning

- `package.json` is the single source of truth for the version.
- The project follows [SemVer](https://semver.org/).
- `create-clarity-theme/package.json` is independently versioned and never needs to match the Theme.

## 3. Changelog

- Every release adds a `## <version> - YYYY-MM-DD` entry to the root `CHANGELOG.md`, **above** all previous releases (descending order; `pnpm docs:check` verifies it).
- Write for Theme consumers: what they can install, what changed in behavior, and what to check when upgrading. Internal development logs stay out.
- Creator-package changes go only in `create-clarity-theme/CHANGELOG.md`.
- `pnpm release:check` requires a changelog entry for the package version.

## 4. Prepare the release commit

1. Bump `version` in `package.json` (and `create-clarity-theme/package.json` only for a creator release).
2. Add the changelog entry described above.
3. Update `create-clarity-theme/templates/default/package.json` so its `clarity-theme` dependency is exactly `^<version>` (caret range on the Theme release being cut). `pnpm release:check` fails on drift — for example a template left at `^<previous-version>` while releasing `<version>`.
4. Run the ordered suite; use `pnpm release:check --allow-untagged` locally before tagging.
5. Commit the release metadata.

## 5. Tag and GitHub Release

- Git tags use `v<version>`; creator releases use `create-v<version>`.
- **npm package version + Git tag + GitHub Release must use the same version.** The publish workflow refuses to run when the release tag does not equal `v${package.json version}`.
- Tag the exact commit that passed the ordered suite:

```bash
git tag v<version>
git push origin v<version>
```

- Draft a GitHub Release on the tag and paste the changelog entry as the release body. Publishing the Release is the human confirmation step that triggers the workflow; do not publish on branch pushes.

## 6. Trusted Publishing (one-time setup per package/workflow)

The workflows use npm **Trusted Publishing (OIDC)**: no `NPM_TOKEN` and no long-lived credentials in GitHub secrets. A maintainer configures this once on the npm website:

| Setting | Theme | Creator |
| --- | --- | --- |
| User/Organization | `iicemeta` | `iicemeta` |
| Repository | `clarity-theme` | `clarity-theme` |
| Workflow filename | `publish.yml` | `publish-create.yml` |
| Registry | `npmjs.org` | `npmjs.org` |
| Environment | `npm` (optional, for release approvals) | `npm` |

## 7. Publish workflow

[`publish.yml`](../../.github/workflows/publish.yml) (Theme):

1. Triggers only on `release: published` for `v*` tags.
2. Checks out the release tag (`fetch-depth: 0`) and verifies tag = `v${package.json version}`.
3. Resolves Node from `engines.node` and pnpm from `packageManager`.
4. Runs the full ordered suite serially: lint → typecheck → verify → test:sync → test:migration → test:contract → peers check → generate → test:consumer → test:compatibility → release:check.
5. Packs the final tarball into `artifacts/`, audits its contents, records the SHA-256 checksum, and runs `npm publish --dry-run`.
6. Publishes that same audited tarball with `npm publish --access public --provenance`.

[`publish-create.yml`](../../.github/workflows/publish-create.yml) is the independent equivalent for `create-clarity-theme`: it ignores Theme tags, validates `create-v${creator version}`, runs the creator CLI and both E2E suites, packs/audits the creator tarball, and publishes it with OIDC provenance. Prerelease versions are automatically assigned the `beta` dist-tag.

Permissions are minimal: `contents: read`, `id-token: write`.

## 8. Provenance and registry verification

After the workflow succeeds:

```bash
npm view clarity-theme@<version> version dist.tarball dist.integrity
pnpm test:registry-consumer
```

- Provenance requires publishing from the GitHub workflow; local `npm publish` does not produce it. Verify signatures with `npm audit signatures` when needed.
- `test:registry-consumer` creates a temporary consumer, installs `clarity-theme@<version>` **from the npm registry** (no local tarball), and runs exports smoke, typecheck, static generation, and output assertions — completing the workspace → tarball → registry consumption chain.
- For the creator, verify with `npm view create-clarity-theme@<version> version dist.tarball` and `npx create-clarity-theme@<dist-tag> --help`.

## 9. Hotfix release

1. Branch from the release tag (`git switch -c hotfix/<version> v<previous-version>`) or fix on the main branch if the release is current head.
2. Apply the minimal fix plus its test.
3. Bump `package.json` to `<version>` and add the changelog entry.
4. Rerun the ordered verification suite on the exact hotfix commit.
5. Tag `v<version>`, push, and publish through a GitHub Release as usual.

## 10. Pre-releases

- Use SemVer pre-release identifiers: `<next-minor>-rc.1`, `<next-minor>-beta.1`.
- Tag them normally (`v<prelease-version>`) and keep the tag/version contract.
- Publish pre-releases to a non-`latest` dist-tag (the creator workflow does this automatically; the Theme workflow may add `--tag next`).
- State in the changelog entry that pre-releases are not covered by stability promises.

## 11. Rollback / unpublish policy

**Never automatically unpublish.** Published npm versions are treated as immutable.

- A defective release is fixed by releasing the next semver-appropriate version.
- Rollback means: revert or fix on Git, then cut a patch release; adjust or close the GitHub Release as needed.
- Unpublishing is a last resort for legal/compromise takedowns only and is always a manual maintainer decision.

## 12. Publishing create-clarity-theme

The creator package has no runtime dependencies and is released independently:

1. Keep `clarity-theme` in `templates/default/package.json` as the caret range of a real published Theme release. The publish workflow validates that the range resolves on npm, so publish the Theme release before shipping a creator whose template range was bumped; the creator package version itself stays independent of the Theme version.
2. Bump only `create-clarity-theme/package.json` and add its own `CHANGELOG.md` entry.
3. Run `pnpm test:create`, `pnpm test:create:e2e`, and `pnpm test:create:tarball` serially on the exact release commit.
4. Ensure the npm Trusted Publisher for workflow `publish-create.yml` is configured once.
5. Tag the exact commit as `create-v<version>`, push, and publish a GitHub Release from it.
6. Verify the registry artifact and public command (§8); promote from the reviewed beta to `latest` only when no further creator changes are needed.
