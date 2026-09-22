# Release Checklist

**English** | [简体中文](./RELEASE-CHECKLIST.zh-CN.md)

> Checklist date: 2026-09-22, Asia/Taipei. The v0.1.0 P0 correctness gates are resolved and the release pipeline is implemented. The gated release version is **`0.1.1`** (the registry's out-of-band `0.1.0` cannot be republished). The working tree passed the ordered verification suite before tagging; the actual publish still requires the exact-tag workflow run plus the manual npm/GitHub steps in §9.

Legend:

- `[x]` complete
- `[ ]` incomplete
- `[!]` needs human confirmation or a post-commit action

## 1. Required Documents

- [x] `README.md` is user-facing and covers introduction, features, requirements, installation, Quick Start, migration, configuration, customization, development, testing, upstream synchronization, release status, and license.
- [x] `docs/MIGRATION.md` covers the tested blog-v3 baseline, backup, inventory, ordered migration, field/file mappings, patch ownership, data safety, validation, and troubleshooting.
- [x] `docs/CONFIGURATION.md` documents `site`, `article`, `feed`, `stats`, `integrations`, `features`, `changelog`, app-config boundaries, visibility, defaults, and a complete example.
- [x] `docs/CUSTOMIZATION.md` documents UI configuration, component overrides, Shiki, CSS, custom application files, server routes, route rules, public assets, and validation.
- [x] `docs/COMPATIBILITY.md` is generated from the compatibility contract and documents the current automated matrix.
- [x] `docs/PATCHES.md` documents why patches remain consumer-owned and adjudicates each known patch.
- [x] `.agents/skills/migrate-blog-v3-to-clarity/SKILL.md` has valid standard frontmatter and the required discovery/inventory/classification/plan/apply/validation/report/rollback workflow.
- [x] Skill references contain file mapping, field mapping, and validation success criteria.
- [x] `docs/RELEASE-AUDIT.md` records the pre-closing audit, actual state, gaps, blockers, and optional work.
- [x] This release checklist exists and distinguishes completed work from release blockers.

## 2. Migration Capability

- [x] The tested source baseline is explicitly documented as blog-v3 3.7.2 at commit `f6ea97d745517feb52f0c100e89acb36f0adc12f`.
- [x] Root site fields, article fields, feed/stats fields, scripts, Twikoo, feature flags, and app UI fields have explicit mappings.
- [x] The guide forbids moving articles, friend data, redirects, patches, deployment data, secrets, or public assets into the Theme.
- [x] Consumer `feeds.ts`, redirects, patches, custom modules, custom server routes, custom components, and custom Shiki configuration have documented preservation rules.
- [x] A fake consumer fixture covers the minimal source shape, Twikoo, feed/stats, redirects, patches, component override, custom Shiki, custom module, custom server route, protected content, and protected public assets.
- [x] `pnpm test:migration` validates the Skill contract, fixture discovery, real Clarity config schema, UI boundary, protected classifications, and migration scenarios.
- [ ] A fully automated agent execution test that applies the Skill to a temporary Git repository and runs a real migrated consumer build is not yet implemented.

## 3. Skill Capability

- [x] Skill name is exactly `migrate-blog-v3-to-clarity`.
- [x] Description matches the required trigger and preservation scope.
- [x] Discovery identifies blog-v3 source files and baseline differences.
- [x] Inventory includes site/article/integration/UI/feed/redirect/patch/custom module/component/server/package data.
- [x] Every asset must be classified `AUTO`, `REVIEW`, `KEEP`, or `NEVER_TOUCH`.
- [x] A plan is required before edits and records current state, target state, reason, risk, and human review.
- [x] Apply rules prohibit destructive changes to articles, frontmatter semantics, public assets, redirects, patches, unknown modules, and server code.
- [x] Validation requires serial install/typecheck/generate plus existing project tests.
- [x] The report must include added/modified/deleted/retained files, unresolved items, failures, and completion status.
- [x] Rollback requires a clean starting tree and stops on pre-existing user changes.
- [x] Detailed knowledge lives in references rather than overwhelming `SKILL.md`.

## 4. Package Contract

- [x] Package name is `clarity-theme`.
- [x] Current package version is `0.1.1`, the gated npm release version.
- [x] Release version/tag decision: release `0.1.1` from tag `v0.1.1` (`0.1.0` is taken by the out-of-band registry publication and cannot be republished).
- [x] License field is MIT and `LICENSE` is included.
- [!] A maintainer/legal reviewer should confirm whether the existing MIT copyright attribution needs an additional current rights-holder line before publication.
- [x] Package metadata has repository, homepage, bugs, engines, and package manager data.
- [x] Package metadata has no author email or other personal contact field.
- [x] Five exports exist: `.`, `./config`, `./content`, `./img`, and `./schema`.
- [x] Runtime and type declaration entries were resolved by the real consumer test.
- [x] `files` includes Layer/config/runtime payloads and excludes docs, playground, tests, CI, Skill, sync manifest, workspace files, and lockfiles.
- [x] Real `pnpm pack` audit reports 148 files, including all 28 required files.
- [x] Tarball audit found no upstream private identifiers, articles, or private configuration.
- [x] Theme purity verification found no forbidden author/site data or cross-project imports.
- [x] Consumer patches remain outside the package payload.
- [x] `publishConfig.access` is `public`.
- [x] `CHANGELOG.md` exists with consumer-facing `0.1.1` and `0.1.0` entries.
- [x] Runtime dependencies are fully declared (48 dependencies, verified by pack audit).
- [x] `main`, `type`, `engines`, `peerDependencies`, and `packageManager` are frozen and asserted by `pnpm release:check`.

## 5. Correctness and Release Blockers

- [x] P0-1: server-consumed configuration (`feed.*`, full `stats.*`, feature route flags, `site.author.email`) moved to Nitro private runtimeConfig; client appConfig carries only the rendering-required subset; asserted by consumer bundle/payload checks.
- [x] P0-2: feature-off routes return 404 in dev/SSR runtime (`nuxt build` + real server assertions in `test:consumer`) in addition to being absent from static output.
- [x] P0-3: anti-mirror navigation corrected (canonical host derived from `site.url`) and exercised by a real-browser mirror-hostname case in `test:compatibility`.
- [x] P0-4: the no-op `useRandomPermalink` field removed from schema, docs, migration mapping, and tests.
- [x] P1-2: multi-pattern stats selection verified as union semantics (`@nuxt/content` 3.16 `orWhere` group) and locked by a `posts/% + notes/%` consumer regression.
- [ ] P1-1: make remote CSS/font origins configurable. **Deferred** to Milestone 2; documented as a known limitation in the 0.1.1 release notes.
- [ ] P1-3: complete sync-manifest classification for known upstream-derived paths. **Deferred** to Milestone 2; documented as a known limitation.
- [ ] P1-4: add a TypeScript/MJS parity gate. **Deferred** to Milestone 2; documented as a known limitation.
- [x] P1-6: design the first npm release workflow. Execution (actual publish) remains a manual release action.
- [x] Resolve or explicitly defer every remaining P1/P2 item in the release notes (P1-1/P1-3/P1-4/P1-5 and P2 items are recorded in `CHANGELOG.md` and `docs/RELEASE-NOTES-0.1.1.md`).

These are tracked in [ROADMAP](./ROADMAP.md). Documentation completion does not clear them.

## 6. Upstream Baseline

- [x] Manifest repository is the intended upstream repository.
- [x] Manifest branch is `main`.
- [x] Manifest commit is `f6ea97d745517feb52f0c100e89acb36f0adc12f`.
- [x] Manifest upstream version is 3.7.2.
- [x] Manifest records Nuxt 4.5.2 and Content `^3.16.0`.
- [x] `pnpm sync:check` passed: the remote head is still `f6ea97d`.
- [x] Weekly sync workflow is read-only and creates/reuses a drift issue.
- [x] Transactional apply, conflict blocking, rollback, and unknown-path protection have 13 passing tests.

## 7. CI

- [x] CI runs lint and Layer 1 checks across the fixed Node matrix derived from `engines.node`.
- [x] pnpm is installed from `packageManager`.
- [x] Layer 1 now includes `pnpm test:migration`.
- [x] Layer 2 runs playground generation.
- [x] Layer 3 runs real consumer and rendering compatibility.
- [x] Jobs remain strictly ordered and do not run build/test phases concurrently.
- [x] Workflow permissions are restricted.
- [x] `publish.yml` runs only on `release: published`, checks out the tag, verifies tag/version equality, reruns the ordered suite serially, packs/audits one tarball, and publishes with OIDC provenance.
- [x] Publish workflow permissions are minimal (`contents: read`, `id-token: write`) and no `NPM_TOKEN` is stored.
- [!] The updated workflow must run on GitHub after this working tree is committed; only the local equivalent suite has run here.

## 8. Verification Evidence

All commands were run serially on 2026-09-22.

| Command | Final result | Notes |
| --- | --- | --- |
| `pnpm lint` | ✅ Pass | No errors after import/code-block fixes |
| `pnpm typecheck` | ✅ Pass | Expected intentional `NUXT_B3011` Badge override warning |
| `pnpm verify` | ✅ Pass | No private-data or cross-project import leakage |
| `pnpm test:sync` | ✅ Pass | 13/13 tests |
| `pnpm test:contract` | ✅ Pass | 41 contract rows and required coverage references |
| `pnpm generate` | ✅ Pass | 51 prerendered routes; one known link-checker warning |
| `pnpm test:consumer` | ✅ Pass | Pack, exports, independent install, typecheck, three generate variants, client-config boundary assertions, and the features-off runtime 404 server check |
| `pnpm test:compatibility` | ✅ Pass | 52 assertion groups; 24 SSR, 12 browser, 11 hydration routes, and the real-browser anti-mirror navigation case (`127.0.0.1` → `localhost`) |
| `pnpm test:migration` | ✅ Pass | 10/10 tests |
| `pnpm peers check` | ✅ Pass | No peer dependency issues |
| `pnpm sync:check` | ✅ Pass | Upstream baseline current |
| `pnpm release:check` | ✅ Pass (after `v0.1.1` tag) | package/tag/CHANGELOG contract, exports/files, pack, and 151-file tarball boundary; the pre-commit run correctly refused the `v0.1.0`-tagged HEAD vs `0.1.1` mismatch |
| `pnpm pack` | ✅ Pass | `artifacts/clarity-theme-0.1.1.tgz`, 151 files, SHA-256 `f72021e7c64df3303eb34a777197c521f867d3629e709524dde22dcc09a2cc3d` |
| `npm publish ./artifacts/clarity-theme-0.1.1.tgz --dry-run` | ✅ Pass | Registry accepts `0.1.1` (`+ clarity-theme@0.1.1`); the earlier `0.1.0` dry-run was correctly rejected because that version was published out-of-band |
| `pnpm test:registry-consumer` | ❌ Against published `0.1.0` (expected) | Installs the real registry package, then fails typecheck **inside the published tarball** (`stats.get.ts` `orWhere` void-return, `link.vue` `never[]` feeds typing) — both fixed in this tree; must pass against the corrected release |
| `git diff --check` | ✅ Pass | No whitespace errors |

Known non-fatal warnings:

- intentional duplicate-name component override warning (`NUXT_B3011`);
- one absolute-site-URL link-checker warning in playground/consumer friend data;
- existing Vue slot/readonly, og:image, twitter:card, and external-resource warning classes;
- pnpm reports two deprecated transitive dependencies and a peer-summary notice during the isolated consumer install, while `pnpm peers check` passes;
- some client chunks exceed 500 kB and Shiki uses remote esm.sh imports.

### Interim failures (corrected)

- The first `pnpm lint` run failed on Markdown import order/incomplete code blocks, fixture import order/package key order, and `node:test` import policy. The documents and fixture were corrected; the final lint run passed.
- The first `pnpm test:migration` run failed on numbered-heading expectations, Windows dynamic-import paths, and an incomplete fixture plan. These were corrected.
- A second migration run exposed a build-time Zod-resolution dependency when calling the Content factory outside Nuxt. The test now validates the public factory contract statically while real consumer/compatibility suites exercise the factory in Nuxt. The final migration test passed.

No test is being reported as currently failing.

## 9. Publication Gate

### Package publication

- [x] package metadata
- [x] publishConfig
- [x] tarball boundary
- [x] release-check
- [x] Git tag/version validation
- [x] publish workflow
- [x] OIDC permissions
- [x] npm trusted publisher documentation
- [ ] actual npm publish
- [ ] npm install from registry
- [ ] final exact-commit verification

### Manual gates

- [x] All ROADMAP P0 items resolved; P1/P2 deferrals recorded in the release notes.
- [!] **Out-of-band publication detected:** `clarity-theme@0.1.0` was published to npm at 2026-09-22T07:28:22Z by `creampack <creampack@iicemeta.com>` from gitHead `5a03778` — the pre-P0-fix tree, outside the release workflow, without provenance. The registry consumer test fails typecheck inside that published package (see §8).
- [x] Maintainer decision: the corrected gated release is **`0.1.1` from tag `v0.1.1`** (npm forbids republishing `0.1.0`); optionally `npm deprecate clarity-theme@0.1.0`; **never auto-unpublish**.
- [!] Commit the reviewed working tree, bump to the chosen release version, tag, and rerun the full ordered suite at that exact tag (the publish workflow does this automatically).
- [x] Release tag, changelog, provenance, artifact checksum, and rollback procedure are defined in [PUBLISHING](./PUBLISHING.md).
- [x] npm package name verified: `clarity-theme` exists on the registry with a live (out-of-band) `0.1.0`; maintainers include `creampack <creampack@iicemeta.com>`.
- [ ] Obtain maintainer/legal confirmation for the MIT copyright notice.
- [ ] Configure the npm Trusted Publisher (see [PUBLISHING §6](./PUBLISHING.md#6-trusted-publisher-one-time-manual-setup)).
- [ ] Trigger the publish workflow by publishing the corrected release's GitHub Release.
- [ ] Review the final tag, package tarball checksum, provenance, release notes, and rollback plan.
- [ ] After publish: run `pnpm test:registry-consumer` and verify the released version with `npm view`.

## Verdict

**Release-closing documentation, migration guidance, Skill, fixture, CI wiring, and local verification: complete.**

**First gated npm release: `0.1.1`, pending the GitHub Release trigger.** All correctness blockers are resolved in this tree and the release pipeline is implemented and documented. The registry's out-of-band `0.1.0` (pre-fix tree, no gate) stays published and cannot be republished; the gated release is `0.1.1` through the documented workflow. "Workflow created" is not the same as "release completed" — do not mark §9 publication items complete until the registry contains `0.1.1`.
