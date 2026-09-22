# Roadmap

> Phase 20 result, recorded on 2026-09-22. This document turns the former scattered TODOs into a prioritized engineering roadmap. It is subordinate to source code, package manifests, tests, CI, and `sync-manifest.json`; implementation may choose better files or techniques as long as the intended boundary and behavior remain the same.

## Current Milestone

**Phase 20 — Technical Debt Triage complete.**

No feature code was changed in this phase. The current code state remains the fully verified v0.1.0 pre-publish candidate described in [PROJECT-STATUS](./PROJECT-STATUS.md). Future development starts with Milestone 1 below, not with re-investigation of the old phase narratives.

## Completed

- Reusable Nuxt 4 Layer extraction and package boundary.
- Strict `clarity.config.ts` schema, defaults, build-time loading, and Content collection factory.
- Core blog UI, routing, Markdown/MDC pipeline, Shiki, KaTeX, Mermaid, ABC, and rich-image behavior.
- Atom, OPML, stats, robots, sitemap, and LLMs outputs.
- Twikoo, head-script, and anti-mirror configuration branches.
- UI and same-path component override mechanisms.
- Tarball consumer acceptance, production SSR, real-browser rendering, dev hydration, contract, peer, purity, and upstream-sync tests.
- Ordered CI pipeline plus weekly read-only upstream drift reporting.
- Current architecture/API/upstream/patch/status documentation.

These statements describe implemented and verified capability, not merely intent. The exact coverage and boundaries are in [PROJECT-STATUS](./PROJECT-STATUS.md) and [COMPATIBILITY](./COMPATIBILITY.md).

## Stable / Frozen

The following contracts should not be redesigned while Milestone 1 is in progress:

- The five package export entries and the distinction between package exports and Layer runtime contracts.
- The consumer file model: `clarity.config.ts`, `content.config.ts`, optional `feeds.ts`, and optional UI-only `app/app.config.ts`.
- The `clarity.config.ts` input shape and strict unknown-field rejection.
- The Content collection factory and article schema boundary.
- The same-path component override behavior even though Nuxt emits `NUXT_B3011`.
- Consumer ownership of site content, deployment rules, secrets, redirects, and package-manager patches.
- Transactional upstream-sync semantics: unknown paths block apply; adapted include paths conflict rather than overwrite.

Narrowing an over-broad runtime appConfig shape is allowed as a v0.1 correction, but the public configuration input and package export surface should not be redesigned to accomplish it.

## P0 — Must Resolve

### P0-1. Move server-consumed configuration out of client-visible appConfig

**Problem / current behavior**

`toPublicClarityConfig()` serializes the full `site`, `article`, `feed`, `stats`, `features`, and `changelog` groups into appConfig. Server handlers read feed/stats/site values through `useClarityConfig()`, and three article fields exist only for build wiring. `integrations.scripts` is already omitted, but the remaining boundary is still broader than its consumers require.

This is an architectural boundary defect and privacy surface, not evidence that the current schema stores a credential. Secret-style values are not represented in `clarity.config.ts`; real secrets must continue to use consumer server-only runtime config.

**Why it exists**

The Theme was extracted incrementally from an upstream application. A single shared appConfig reader preserved upstream behavior while the Layer/package boundary was being established.

**Impact**

- User: larger client payload and an implied privacy surface that the Theme does not actually intend to guarantee.
- Consumer: `useClarityConfig()` and generated types expose fields that consumer client code does not need; accidental site-field overrides in `app/app.config.ts` are only warned, not rejected.
- Upstream: tighter configuration ownership makes future upstream changes easier to classify.

**Tests**

The historical bundle audit proves `integrations.scripts` was removed, but there is no permanent contract asserting which non-public fields remain absent from client output.

**Risk / cost**

Medium risk because Nitro bundling, appConfig typing, static generation, and public helper return shapes interact. Medium cost. This is architecture hardening, not an emergency security patch.

**Chosen direction and milestone**

- Keep `clarity.config.ts` input compatibility.
- Introduce a server-only resolved configuration source for Atom/OPML/stats and build-only values. A private Nitro runtime config or virtual server module is preferable to making the existing `#clarity/config` alias a new public export.
- Remove `feed.*`, `article.useRandomPermalink`, `article.hidePostPrefix`, and `article.robotsNotIndex` from client appConfig.
- Treat `stats.includePaths` explicitly: either derive the small client display fact used by `BlogStats` from it, or document it as intentionally client-visible. Do not silently leave it under an unclear “server config” label.
- Keep `site.author.email` out of client appConfig if possible, while preserving existing public feed/meta output until the separate visibility option is decided.
- Keep client-required Twikoo and anti-mirror data public.
- Turn the app-config boundary warning into a deterministic build/type boundary where Nuxt permits it.
- Add payload and type assertions for the new split.

Implementation notes: `modules/clarity-config`, `config/public.ts`, `config/app.ts`, `server/**`, `shared/utils/clarity.ts`, and the consumer/compatibility harnesses.

### P0-2. Give feature-off routes one runtime semantic

**Problem / current behavior**

`features.atom`, `features.opml`, and `features.stats` control prerender route rules and the Atom alternate head link. The Nitro handlers themselves do not check the flag. Static output may therefore omit the files while dev/SSR runtime still serves them.

**Why it exists**

The first implementation met the tested static-generation requirement without changing upstream-derived server handlers.

**Impact**

- User: disabled public features can remain discoverable and serve data in non-static deployment.
- Consumer: deployment behavior differs between `generate` and SSR/dev.
- Upstream: route guards are Theme-owned and should not interfere with upstream handler content changes.

**Tests**

The current consumer feature-off variant asserts generated files are absent. It does not request the routes from a server or assert a 404 status.

**Risk / cost**

Low to medium risk; low cost. The main risk is accidentally disabling a route that a consumer override intentionally reinstates.

**Chosen direction and milestone**

A disabled feature must mean the route is absent in static output **and** returns 404 in dev/SSR. Implement this as a v0.1 bugfix before the first npm release; the configuration API does not change. Milestone 1.

Implementation notes: feature state must be available to the server-only configuration source from P0-1; `server/**`; feature-off consumer and SSR cases.

### P0-3. Verify and correct anti-mirror navigation

**Problem / current behavior**

Injection is implemented and tested, including base64 encoding of the blacklist and site URL. Runtime navigation is not tested. Source inspection also shows that the full `site.url` string is decoded and assigned to `location.host`; the URL host setter expects a host, not a URL. This is a high-confidence correctness risk, not merely a missing test.

**Why it exists**

The behavior was inherited from the upstream module. Extraction tests deliberately verified script injection and removal of upstream defaults without navigating from a simulated mirror.

**Impact**

- User: an enabled anti-mirror feature may fail to return visitors to the canonical host.
- Consumer: the integration cannot yet be presented as release-complete.
- Upstream: the same questionable target handling exists upstream; a Theme fix may later support an upstream report.

**Tests**

Current tests cover enabled/disabled branches and encoded script content only.

**Risk / cost**

Low risk after adding a focused browser test; low cost. The likely correction is to derive and pass the canonical host rather than the full URL while preserving the canonical-link update.

**Priority / milestone**

P0 in Milestone 1. Do not release the integration as verified until a real browser case exercises navigation from a mirror-like hostname.

Implementation notes: anti-mirror module/client and compatibility browser harness.

### P0-4. Remove or explicitly relocate the no-op `useRandomPermalink` contract

**Problem / current behavior**

The schema accepts `article.useRandomPermalink`, but the Theme does not generate stable permalinks. It is only a hint for external build scaffolding.

**Why it exists**

The field was preserved while translating the upstream blog configuration contract.

**Impact**

- User: a public switch appears to promise behavior that the Theme does not own.
- Consumer: future scaffolding tools may depend on an accidentally exposed no-op field.
- Upstream: stable random permalink generation requires persistent consumer/site scaffolding, not generic Layer rendering.

**Tests**

The feature-off consumer variant only proves schema acceptance and build compatibility.

**Risk / cost**

Low risk before the first npm release; low cost. Implementing a generator would be higher risk and is not planned.

**Chosen direction and milestone**

Before the first semantic package release, remove the no-op from the Theme's public configuration API, or move it to an explicitly documented consumer-scaffolding extension namespace. Do not implement random permalink generation in the Theme. Milestone 1.

Implementation notes: config schema/runtime dual tracks, configuration docs, API docs, consumer contract, and Content tests.

## P1 — Next

### P1-1. Make external CSS/font origins configurable

**Problem / current behavior**

KaTeX and Inter default to `s4.zstatic.net`; JetBrains Mono/Noto Serif SC default to Google's `.cn` font endpoints. These Layer head links are fixed, and ordinary consumer head additions do not provide a documented way to remove or replace them.

**Why it exists**

They are inherited defaults optimized for the upstream site's region.

**Impact**

- User: availability, privacy, CSP/vendor policy, and performance depend on a default the consumer did not choose.
- Consumer: this is public Layer behavior even though it is not currently a `clarity.config.ts` field.
- Upstream: origin choice is site/region policy, not generic Theme rendering logic.

**Tests**

Current rendering tests prove the defaults work; no variant overrides the origins.

**Risk / cost**

Medium risk because it adds public configuration API; medium cost. It is not a correctness or secret-security blocker.

**Chosen direction and milestone**

Add one documented asset-origin configuration group with explicit defaults, replacement, and a way to disable Theme-provided remote links. Keep the existing defaults for compatibility unless release review decides that neutral defaults are required. Milestone 2.

Implementation notes: config schema/runtime, build module head wiring, architecture/configuration/API docs, and consumer branch tests.

### P1-2. Correct multi-pattern stats selection

**Problem / current behavior**

`stats.includePaths` is reduced through repeated `where()` calls inside one query group. Query-group semantics make those conditions conjunctive. Consequently, multiple patterns such as `posts/%` and `notes/%` select rows matching both, which is normally impossible, rather than the intended union.

**Why it exists**

The current automated fixture uses one pattern, so the composition error was not exposed.

**Impact**

- User: stats can incorrectly become empty when more than one content pattern is configured.
- Consumer: the documented array semantics are misleading.
- Upstream: this is a Theme server adaptation, not inherited upstream behavior.

**Tests**

One `posts/%` fixture is verified; no multi-pattern case exists.

**Risk / cost**

Low risk; low cost.

**Priority / milestone**

P1 in Milestone 1 or immediately after the server-config split, because it is a concrete correctness defect even though the default single-pattern path is correct.

Implementation notes: stats Nitro handler and consumer compatibility fixture.

### P1-3. Complete sync-manifest classification for known upstream-derived paths

**Problem / current behavior**

`app/stores/**`, `app/types/**`, and `app/utils/**` are unknown. At the current baseline, stores and generic type/utility files are unchanged; `app/types/article.ts`, `app/types/feed.ts`, and the public image helper boundary have Theme adaptations.

**Why it exists**

The original manifest covered the largest direct-sync areas first and deliberately left surprises blocked as unknown.

**Impact**

- User: future upstream changes in those directories block apply unnecessarily.
- Consumer: no direct consumer impact.
- Upstream: safe, but manual classification is required on every relevant drift.

**Tests**

Unknown blocking itself has sync-tool regression coverage; the proposed specific mapping is not yet represented.

**Risk / cost**

Low risk; low cost. Do not weaken the unknown safety net.

**Chosen classification**

- Include: `app/stores/**`, `app/types/index.ts`, `app/types/nav.ts`, `app/utils/anim.ts`.
- Transform: `app/types/article.ts`, `app/types/feed.ts`, `app/utils/img.ts` because they are tied to Layer imports or the public package API.
- Leave Theme-only `app/types/modal.ts` unclassified or explicitly manual if protection from a future upstream collision is desired.
- Keep unknown as the final safety mechanism for genuinely new/unexpected paths.

**Priority / milestone**

P1 in Milestone 2, before the next substantive upstream sync.

### P1-4. Add a TypeScript / MJS parity gate

**Problem / current behavior**

Public runtime `.mjs` files and TypeScript type/implementation sources are manually paired. Existing tests prove the current runtime entries exist and exercise part of their behavior, but do not systematically compare schema shape, defaults, export names, or helper semantics with the TS sources.

**Why it exists**

Native TypeScript loading cannot be assumed for files inside `node_modules`, so the package needs runtime JavaScript entries.

**Impact**

- User: future schema/helper edits can ship type/runtime drift.
- Consumer: package imports may validate or behave differently from generated types.
- Upstream: no direct upstream impact.

**Tests**

Tarball reference audit, Node smoke, and typecheck cover existence and a subset of behavior, not parity.

**Risk / cost**

Low risk if implemented as a contract check; medium cost to define meaningful parity. Automatic source generation is a larger build-system change and is not the first step.

**Chosen direction and milestone**

Add a deterministic parity check for paired export names, schema defaults/strictness, and representative helper outputs before considering generation. Milestone 2.

Implementation notes: verification/contract harness and paired files under `config/`, `img/`, and `remark-plugins/`.

### P1-5. Reduce the `plain-shiki` consumer patch

**Problem / current behavior**

The differential consumer patches `plain-shiki` so `::highlight(name)` descendants receive the intended scope. Theme tests currently run unpatched and intentionally accept that environment difference.

**Why it exists**

The defect is in an upstream dependency selector implementation; a consumer patch preserved the real blog behavior.

**Impact**

- User: exact plain-highlight colors differ between patched and unpatched environments.
- Consumer: real sites must maintain a patch for a Theme-owned rendering feature.
- Upstream: a small upstream dependency fix or supported selector configuration is preferable to a fork.

**Tests**

Rendering is verified, but exact patched plain-highlight scope is not a current CI gate.

**Risk / cost**

Medium risk because selector behavior affects both themes; low-to-medium cost.

**Chosen direction and milestone**

Evaluate Theme-side selector configuration first, then submit/follow an upstream dependency fix. Do not fork the dependency. Milestone 2.

### P1-6. Establish the first package release workflow

**Problem / current behavior**

The package is unpublished and consumers must pin a Git commit. Verification already packs a real tarball, but there is no tag, npm publish, provenance, release-notes, or release dry-run workflow.

**Why it exists**

Release was intentionally deferred until the extraction and verification boundary stabilized.

**Impact**

- User: installation is less discoverable and less reproducible.
- Consumer: Git dependency resolution and future migration to npm must be handled manually.
- Upstream: no direct impact.

**Tests**

Consumer installation from the current tarball is verified; publishing itself is not.

**Risk / cost**

Medium risk because publication makes API semantics binding; medium cost.

**Priority / milestone**

P1 release enablement, executed in Milestone 3 and completed in Milestone 4 only after P0 work and the chosen P1 contract changes are complete.

### Patch ownership adjudication

The package itself remains patch-free. The current engineering classification is:

| Dependency patch | Concern classification | Roadmap judgment |
| --- | --- | --- |
| `@nuxtjs/mdc` detab-only | Consumer content concern; possible upstream behavioral discussion | Keep as a consumer patch for sites that need original tab preservation. The Theme should continue supporting both slot and `code` input unpatched. Do not fork or redistribute the patch. |
| `@nuxt/image` fractional density | Upstream dependency concern affecting a Theme image feature | Consumer patch remains temporary for affected content; pursue the upstream parsing fix and add a Theme regression case when supported. |
| `ipx` ICO passthrough | Consumer deployment/content concern | Optional site recipe only. It is not a Theme requirement and should not move into the Theme. |
| `plain-shiki` selector scope | Theme rendering concern caused by an upstream dependency defect | P1-5: evaluate supported Theme selector configuration and an upstream follow-up before considering any fork. |
| `@vue/shared` file in differential workspace | False positive | It is not registered in the differential workspace and does not activate. |

## P2 — Later

### P2-1. Incremental interaction, accessibility, responsive, and failure testing

Current implementation must not be labeled incomplete merely because an interaction lacks automation. The precise gaps are:

- Implemented and partially verified: archive controls, code collapse/copy, widget combinations, preview entry, responsive drawers/masks, custom error UI.
- Implemented but untested: Twikoo remote initialization/UI, ABC audio, search keyboard behavior/ranking, image-service failure.
- Implemented upstream UI but no viewport automation: responsive layout.

Add these incrementally around real failure modes; do not block Milestone 1 on broad UI coverage expansion.

### P2-2. Reduce accepted warning classes

The suite intentionally tolerates `NUXT_B3011`, link-checker/resource noise, Vue slot/readonly warnings, empty/undersized og:image, deprecated `twitter:card`, and remote Shiki resources. Component override functionality itself is correct. Investigate warning classes only after boundary fixes; do not hide useful diagnostics broadly.

### P2-3. Support restricted/offline Shiki builds

Remote `esm.sh` engine imports can fail in restricted networks. Investigate bundling or an explicit local engine option. This is dependency hardening, not a current rendering defect.

### P2-4. Decide author-email visibility

`site.author.email` is optional, documented as public feed/OPML/author metadata, and currently reaches appConfig. After P0-1 removes unnecessary client serialization, decide whether a visibility/output option is justified. Do not add a new feature without a concrete anti-spam/privacy requirement.

### P2-5. Generalize purity checking

The current verifier uses an explicit upstream identifier allow/block list and path-specific historical audit allowlist. A manifest-driven or broader leak taxonomy can reduce blind spots, but explicit rules also make investigations deterministic. Improve incrementally without weakening the current guarantees.

### P2-6. Split large verification harnesses only when needed

The consumer and compatibility scripts are long but deterministic, ordered, and central to release confidence. Refactor reporting modules only when a P0/P1 change makes them difficult to maintain; coverage and failure clarity must not decrease.

## Deferred

### Deferred-1. Differential consumer redesign

The external `theme-based-blog-v3` environment is valuable historical evidence but is not in Git, not a CI gate, and its tarball/output predate current HEAD. Options:

| Option | Judgment |
| --- | --- |
| A. Historical manual tool | Keep now, clearly marked non-authoritative. Lowest cost and preserves the environment. |
| B. Add to this repository | Reject: it would mix upstream articles/private site data into the Theme package and weaken the purity boundary. |
| C. Independent private repository/template | Preferred eventual design if differential testing continues to find edge cases. Version its manifest, patches, content source, workflow, and Theme reference. |
| D. Delete | Reject now: it still provides real-content insight unavailable from synthetic fixtures. Archive before any future deletion. |

Deferred until after Milestone 2. Re-run manually only when a specific content-compatibility change needs it; never cite its persisted output as current verification.

### Deferred-2. Node 26 CI coverage

`>=26` is an open engine branch with no stable fixed CI representative. Add a matrix branch when a fixed supported Node 26 range is declared. Do not remove the open engine branch merely because CI cannot represent it today.

### Deferred-3. Broad visual regression / new platform work

A visual regression system, CMS, database layer, and general i18n framework remain outside the current product boundary. Revisit only after release maintenance demonstrates a concrete need.

## Won't Fix

- **Implement random permalink generation in the Theme.** Stable generated permalinks require consumer persistence/scaffolding and are not generic Layer rendering behavior.
- **Carry consumer package-manager patches.** Pnpm patches do not transit through an npm package and depend on consumer content/deployment choices.
- **Operate third-party services.** Twikoo, analytics, search indexes, image proxies, comment backends, and CDNs remain integrations, not Theme-hosted services.
- **Automatically merge upstream changes.** Sync remains advisory, transactional, and human-reviewed.
- **Move the full differential blog into this repository.** See Deferred-1.
- **Guarantee that `clarity.config.ts` or appConfig can store secrets.** Real credentials belong in consumer server-only runtime config.

## Duplicate / False-positive Triage

- Server-safe config, route guards, CDN defaults, differential state, sync classification, and dual-track drift were each listed in multiple old status sections. They are consolidated here under one ID each.
- “Automated tests run unpatched” is not itself a defect: the unpatched path is the correct default Theme CI. The actual debts are the stale differential environment and known dependency patches.
- `ipx` is not a default Theme requirement. It is optional and applies only when an ICO is actually routed through IPX.
- The unregistered `@vue/shared` patch in the differential workspace does not activate and is not Theme debt.
- The same-path component override is functioning as designed; only its `NUXT_B3011` warning noise remains a P2 quality issue.

## Release Readiness

A first npm release should be blocked until:

1. Every P0 item is implemented and covered by automated tests.
2. The chosen P1 API changes in Milestones 2–3 are complete; postponed P1/P2 items have explicit release-notes entries.
3. The complete ordered verification suite passes on the release code commit, not merely on a prior code-equivalent commit.
4. A real tarball install and npm publish dry run pass.
5. Package version/tag, changelog, provenance, and rollback procedure are defined.
6. The upstream baseline is current or the release explicitly documents the reviewed delta.
7. Public configuration visibility and remote-origin defaults are accurately documented.

## Upstream Maintenance

- Weekly sync workflow remains read-only and issue-reporting only.
- `sync:apply` remains transactional and requires a clean tree.
- Unknown paths continue to block baseline advancement.
- Complete P1-3 classification before the next substantive upstream sync.
- Adapted include files are expected to conflict; that is safer than silent overwrite.
- Transform/manual changes require redesign and review in the Theme, not textual merging.
- Consumer patches remain outside the sync payload and are adjudicated in [PATCHES](./PATCHES.md).

## Milestones

### Milestone 1 — Core boundary and correctness hardening

Scope: P0-1 through P0-4, plus P1-2 when the server config split touches stats behavior.

Rationale: resolve public semantics, route behavior, and high-confidence correctness defects before adding more API surface. This milestone must not redesign the UI or package export model.

Exit criteria: server/client config boundary asserted; feature-off routes return 404 and vanish from static output; anti-mirror navigation exercised in a real browser; no-op permalink contract removed or explicitly relocated; multi-pattern stats tested; full ordered verification suite passes.

### Milestone 2 — Compatibility and quality refinement

Scope: P1-1, P1-3, P1-4, P1-5, and targeted tests introduced by those changes.

Rationale: these changes improve consumer compatibility and maintainability without blocking the correctness work. Asset-origin configuration and manifest classification both affect public or synchronization contracts and deserve isolated review.

Exit criteria: remote asset origins configurable; known path classifications explicit; TS/MJS parity gate passes; plain-shiki direction validated; upstream sync remains current or a reviewed delta is recorded.

### Milestone 3 — Release-candidate hardening

Scope: P1-6, final documentation synchronization, full release dry run, and targeted P2 cleanup that reduces user-visible warning noise or installation risk.

Rationale: freeze API behavior before publication and verify the exact release commit through the existing layered pipeline.

Exit criteria: release readiness checklist above is satisfied except for the actual npm publication.

### Milestone 4 — Release and maintenance

Scope: tag and publish the first package release, migrate documentation from Git-pin language to the released package range, monitor installation/CI, and begin incremental P2 coverage.

Rationale: publication is a maintainership step, not a substitute for Milestone 1 correctness work. After release, semantic versioning and upstream drift maintenance become the governing constraints.

## Do Not Do Now

- Do not implement a random permalink generator.
- Do not import the full differential blog or its content into this repository.
- Do not adopt, fork, or redistribute consumer dependency patches.
- Do not automatically generate all `.mjs` files before adding a minimal parity gate.
- Do not refactor the complete UI or test harness while boundary correctness is unresolved.
- Do not chase every interaction, accessibility, or warning gap before the first release.
- Do not advance the upstream baseline past an unreviewed delta.
