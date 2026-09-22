# Release Checklist

> Checklist date: 2026-09-22, Asia/Taipei. Validation ran serially against the current working tree after the documentation, Skill, fixture, and CI updates. It has not yet been committed or tagged; a first public npm release needs another exact-commit run after the remaining P0 work.

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
- [x] Current package version is `0.1.0`, explicitly documented as a pre-publish candidate.
- [ ] A first release version/tag decision has not been made.
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

## 5. Correctness and Release Blockers

- [ ] P0-1: split server-consumed configuration from client-visible appConfig.
- [ ] P0-2: give feature-off routes a verified runtime semantic.
- [ ] P0-3: verify and correct anti-mirror navigation.
- [ ] P0-4: remove or explicitly relocate the no-op `useRandomPermalink` contract.
- [ ] P1-2: correct and test multi-pattern stats selection.
- [ ] P1-1: make remote CSS/font origins configurable.
- [ ] P1-3: complete sync-manifest classification for known upstream-derived paths.
- [ ] P1-4: add a TypeScript/MJS parity gate.
- [ ] P1-6: design and execute the first npm release workflow.
- [ ] Resolve or explicitly defer every remaining P1/P2 item in the release notes.

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
- [!] The updated workflow must run on GitHub after this working tree is committed; only the local equivalent suite has run here.

## 8. Verification Evidence

All commands were run serially on 2026-09-22.

| Command | Final result | Notes |
| --- | --- | --- |
| `pnpm lint` | ✅ Pass | No errors after import/code-block fixes |
| `pnpm typecheck` | ✅ Pass | Expected intentional `NUXT_B3011` Badge override warning |
| `pnpm verify` | ✅ Pass | No private-data or cross-project import leakage |
| `pnpm test:sync` | ✅ Pass | 13/13 tests |
| `pnpm test:contract` | ✅ Pass | 39 contract rows and required coverage references |
| `pnpm generate` | ✅ Pass | 51 prerendered routes; one known link-checker warning |
| `pnpm test:consumer` | ✅ Pass | Pack, exports, independent install, typecheck, and three generate variants |
| `pnpm test:compatibility` | ✅ Pass | 51 assertion groups; 24 SSR, 12 browser, and 11 hydration routes |
| `pnpm test:migration` | ✅ Pass | 10/10 tests |
| `pnpm peers check` | ✅ Pass | No peer dependency issues |
| `pnpm sync:check` | ✅ Pass | Upstream baseline current |
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

- [ ] All ROADMAP P0 items resolved or explicitly deferred with user-approved release notes.
- [!] Commit the reviewed working tree and rerun the full ordered suite at that exact commit.
- [ ] Run `npm publish --dry-run` with the intended registry and provenance settings.
- [ ] Define release tag, changelog, provenance, artifact retention, and rollback procedure.
- [ ] Confirm npm package name availability and final distribution channel.
- [ ] Obtain maintainer/legal confirmation for the MIT copyright notice.
- [ ] Trigger and approve the updated GitHub Actions pipeline.
- [ ] Review the final tag, package tarball checksum, release notes, and rollback plan.

## Verdict

**Release-closing documentation, migration guidance, Skill, fixture, CI wiring, and local verification: complete.**

**First public npm release: not ready.** The existing P0 correctness blockers and publication workflow items above remain. The current package should remain explicitly marked as a v0.1.0 pre-publish Git dependency until those gates are cleared.
