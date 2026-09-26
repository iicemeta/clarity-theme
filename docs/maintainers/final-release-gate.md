# Final Release Gate Record

**English** | [简体中文](./final-release-gate.zh-CN.md)

Phase 8 verifies that the release candidate promoted in
[rc.2 promotion](./rc2-promotion.md) is ready to become the stable 0.2 release.
No feature work, no upstream sync, no gate relaxation.

**Outcome: ~~`FINAL-RELEASE-BLOCKED`~~ → `FINAL-RELEASE-READY`**

Phase 8 reported exactly one blocker — a documentation-governance false
positive, not a product defect. It was resolved in Phase 8.5 by narrowing the
rule to what it had always claimed to check; see
[Resolution](#resolution). Everything below is the original audit, kept as the
record of what was verified and why the blocker was real.

## 1. Release identity

| Item | Value |
| --- | --- |
| Current RC | `release/0.2.0-rc.2` at `5dde483` |
| Release branch | `release/0.2.0` — created from rc.2, identical at creation |
| Final version | the stable 0.2 release of the 0.2.0 line (see the root changelog; the governance rule in §10 forbids quoting the literal here) |
| Delta rc.2 → final | `package.json` version line + one new changelog section |

`git diff release/0.2.0-rc.2..release/0.2.0` touches **no `src/` file, no sync
infrastructure, no runtime logic and no parity logic** — verified explicitly
(§10).

## 2. Upstream baseline

| Item | Value |
| --- | --- |
| Formal baseline | `f6ea97d745517feb52f0c100e89acb36f0adc12f` — upstream 3.7.2 |
| Current `upstream/main` | `f6ea97d745517feb52f0c100e89acb36f0adc12f` |
| Result | **MATCH — Gate 1 passed** |

Checked first, before anything else, with a fresh fetch. Had it moved, the
phase would have stopped there; it did not move, so the formal baseline was
confirmed and every downstream check ran against it.

`pnpm sync:verify` also passes on this branch, which independently requires the
manifest baseline to equal upstream `main`.

## 3. Package

The final tarball was **packed fresh** from this branch (not reused from the
rc.2 run) into a directory outside the repository, then audited independently
of the release gate.

| Item | Value |
| --- | --- |
| Tarball | `clarity-theme-<version>.tgz`, 107,154 bytes |
| Files | 157 |
| Root entries | `LICENSE`, `README.md`, `README.zh-CN.md`, `nuxt.config.ts`, `package.json` — nothing else |
| Exports | `.` / `./config` / `./content` / `./img` / `./schema` — all nine runtime + type targets present in the tarball |
| Types | `.d.mts` tracks present for `config`, `content`, `img`, `schema` |
| Dependencies | 51 runtime dependencies |
| `src/generated` | **ABSENT** |
| `node_modules` | **ABSENT** |
| Private data / secrets / lockfiles / workspace files | **ABSENT** (0 matches across all forbidden-path rules) |
| `docs/` `tests/` `scripts/` `playground/` | **ABSENT** |
| `package.json` in the tarball | name / version / `type: module` / `main` / `files` (incl. the defensive `!src/generated`) / 5 export entries / peers / engines — all consistent with the branch |

`src/blog.config.ts` ships in the tarball and is correct to do so: it is the
Theme's own upstream-compatibility adapter (a `CLARITY-ONLY` boundary file that
maps `clarity.config.ts` onto the flat `blog.config` shape), not upstream site
data.

## 4. Clean consumer

An outside-repository consumer was created from the creator template — not from
the playground or any existing fixture — and pointed at the final tarball
through `file:` only.

| Step | Local result |
| --- | --- |
| `pnpm install` | **BLOCKED** |
| `pnpm dev` / `build` / `generate` / `preview` | **BLOCKED** (downstream of the install) |

Two independent host limitations, both long-documented in this repository's
history and neither a package defect:

1. A fresh install fails in `esbuild`'s postinstall, which cannot spawn its own
   binary with a piped `stdio` on this host (`status: null`, `pid: 0`).
2. pnpm cannot create the symlink tree (790 top-level entries expected; only 1
   materialises), so the installed package and the `nuxt` binary are not
   reachable.

Two workarounds were tried and are recorded for completeness: installing with
`--ignore-scripts` gets past (1) but still hits (2); pnpm's
`--config.node-linker=hoisted` avoids symlinks entirely but its top-level
linking also fails to materialise.

**The same lifecycle is verified on CI**, where neither limitation exists: the
`Layer 3 · real consumer + rendering regression` job packs this exact source
tree, installs it into a fresh outside-repo consumer, typechecks it, generates
three configuration branches and asserts the emitted HTML. It passed on the
rc.2 tree and on this branch (§10).

## 5. HTML

Verified through the workspace generation path (the Layer linked from source),
which is the same source tree the tarball contains.

| Item | Value |
| --- | --- |
| Prerendered routes | 51 |
| HTML files | 17 |
| `/` | 60,707 bytes |
| `/link` | 52,665 bytes |
| `/archive` | 47,970 bytes |
| article (`/hello-clarity`) | 61,522 bytes |
| Rendered DOM markers | `blog-root`, `emoji-tail`, article links all present — not client-only shells |
| DOUYIN font reference | present (the historical regression stays fixed) |
| CSS chunks | 33 |

The four page sizes are each exactly **5 bytes smaller** than the rc.2 build.
That is fully accounted for: the HTML carries the Theme's `generator` meta, and
the stable version string is 5 characters shorter than the release-candidate
string. Verified — one occurrence per page, no other difference. Rendering is
byte-equivalent apart from the version stamp.

## 6. Runtime Parity

**PASS on CI.** The `Layer 4 · runtime parity gate` job passed on both the rc.2
head (`2m38s`) and this branch's pull-request run, comparing the tarball-built
consumer against the upstream build across DOM, attributes, stylesheets,
computed style and geometry at desktop and mobile widths. The 2px geometry
tolerance was not touched.

Locally the gate is blocked: the harness cannot resolve this host's pnpm
installation to build its upstream consumer. No local verdict was produced.

## 7. Visual Parity

**Triggered explicitly for this release** rather than left to the nightly
schedule: the `parity` workflow was dispatched on the release branch, running
runtime + visual parity with the screenshot/diff artifacts uploaded.

Result and artifacts: see the workflow run on the release branch. The gate
compares `/`, `/link`, `/archive` and the article page at desktop and mobile in
light and dark, across fonts, stylesheets, layout, typography, cards, spacing
and geometry. Screenshots are diagnostic evidence, not a pass/fail criterion —
any difference must first be attributed to content, runtime, theme or rendering
environment before the Theme is touched.

## 8. Source Parity

**PASS**, against the formal baseline.

| Gate | Result |
| --- | --- |
| `pnpm test:upstream-parity` | PASS — upstream `f6ea97d` (3.7.2), 120 files: 103 `identical` / 16 `mechanical` / 9 `boundary` / 1 `bugfix`. Identical to rc.1 and rc.2; no class widened. |
| `pnpm test:transform-parity` | PASS — 6/6 |

The rehearsed upstream commit does **not** appear: the manifest baseline is the
formal one, and `sync:verify` passes, which requires the manifest baseline to
equal upstream `main`.

## 9. Legacy Audit

Nine identifiers audited across the whole repository.

| Surface | Result |
| --- | --- |
| `src/` (Theme runtime) | **NONE** — 0 matches |
| `create-clarity-theme/` (creator + template) | **NONE** — 0 matches |
| `scripts/` | **NONE** — 0 matches |
| `tests/` | **NONE** — 0 matches |
| `docs/`, root README | **MIGRATION / HISTORY** only — the legacy-policy migration table, the `HISTORY` classifications in `architecture.md`, the "removed in 0.2.0" statements in `api.md` and the migration guide. All are the classifications the 0.2.0 governance mandates. |
| `docs/history/`, `CHANGELOG.md` | **HISTORY** (frozen records, exempt by design) |
| `skills/` | **MIGRATION** only |

No removed 0.1.x API re-entered the runtime, the creator template, or the
current API documentation. `src/generated` is absent.

## 10. Full Gate Matrix

| Gate | Result | Notes |
| --- | --- | --- |
| upstream baseline (`upstream/main` == formal baseline) | **PASS** | Gate 1, checked first |
| lint | **PASS** | 0 errors, 0 warnings |
| docs:check | **PASS** | resolved by Phase 8.5 — 0 stamps, 0 legitimate references rewritten (see [Resolution](#resolution)) |
| typecheck | **PASS** | 0 errors |
| verify (purity) | **PASS** | clean |
| source parity | **PASS** | formal baseline, rc.1 class counts |
| transform parity | **PASS** | 6/6 |
| config / migration / contract | **PASS** | all three |
| sync baseline check (`sync:verify`) | **PASS** | manifest baseline == upstream `main` |
| peer audit | **PASS** | no issues |
| sync tool regression | **PASS** | 25/25 |
| generate (playground) | **PASS** | 51 routes, real HTML |
| HTML audit | **PASS** | §5 |
| pack | **PASS** | fresh tarball, 157 files |
| release check | **PASS** | version consistent, boundary clean, `--allow-untagged` (tagging is out of scope for this phase) |
| consumer (outside-repo tarball) | **BLOCKED locally / PASS on CI** | §4 |
| runtime parity | **PASS on CI** | §6 |
| visual parity | **RUN on CI** | §7 — dispatched for this release |
| legacy audit | **PASS** | §9 |
| CI | **PASS** | run `36225501919` on the release head: 10/10 jobs green, including `Layer 1 · lint` (which runs `docs:check`), `Layer 3 · real consumer`, `Layer 3b · file install` (ubuntu + windows) and `Layer 4 · runtime parity gate`. The `parity` workflow was dispatched separately on this branch (run `36225501055`, runtime + visual parity, PASS). |

## 11. The blocker, and the two ways to clear it

### What happens

`docs:check`'s first rule forbids the current release version anywhere under
`docs/` outside the changelog and frozen history. Its comment states the
policy: *"the release version should only be recorded in CHANGELOG.md"*.

That policy was written while the current version was a 0.1.x release
candidate, at which point `docs/` referred to the *0.2 line* — a future line —
and complied. Promoting the version to the stable 0.2 release inverts the
relationship: the exact documentation that the 0.2.0 governance requires now
names the current version and is rejected.

### The audit of all 74 occurrences

Every occurrence was read and classified. All are legitimate and required:

| Kind | Where | Why it must stay |
| --- | --- | --- |
| `HISTORY` classification ("deleted in 0.2.0") | `architecture.md` (+ zh) | mandated by the documentation classification rules |
| `MIGRATION` mapping and table (`0.1.x → 0.2.0`) | `legacy-policy.md` (+ zh) | the migration map consumers need |
| `MIGRATION` statement ("removed in 0.2.0") | `api.md`, `migration-from-blog-v3.md` (+ zh) | tells upgraders exactly which release removed it |
| consumer install range (`^0.2.0` = `>=0.2.0 <0.3.0`) | `new-project.md`, `migration-from-blog-v3.md` (+ zh) | the version contract the creator template and `release:check` enforce |
| promotion record ("the 0.2.0 line") | `rc2-promotion.md` (+ zh) | release provenance |

None is a snapshot-style stamp that would go stale. The rule is flagging
correct documentation.

### Why Phase 8 did not fix it

Modifying `scripts/check-docs.mjs` so that the release version passes is, in
form, exactly what this phase forbids: changing a gate's expectation to turn a
red gate green. The alternative — rewriting the version references across 16 bilingual
documents so they no longer name the release that the 0.2.0 legacy policy
documents — would degrade the migration documentation that the 0.2.0 governance
itself mandates.

Both are real options with real trade-offs, and choosing between them is a
maintainer decision about documentation policy. So the blocker is reported
instead of papered over.

### The two candidate resolutions

1. **Narrow the rule to its stated intent.** The rule should stop version
   *stamps* (docs presenting the current version as a snapshot), not references
   to a release that the documentation is describing. Narrowing it — for
   example, skipping the check for a stable (non-prerelease) version, or
   exempting the line — would let the release through without touching a single
   document. Cost: the rule becomes narrower; a future regression where docs
   hardcode the current version would no longer be caught by this rule.
2. **Conform the documents.** Move or reword the 74 occurrences so `docs/` no
   longer quotes the release (line notation such as `0.2.x`, or links into the
   changelog / `docs/history`). Cost: the migration documentation loses the
   precision of naming the exact release, across 16 bilingual files.

Either resolves the blocker; after either, the release gate should be re-run
and the assessment re-evaluated.

## Resolution

Phase 8.5 resolved the blocker by **narrowing the rule**, not by rewriting the
documents. The maintainer decision was recorded up front: migration
documentation must be able to name the release that removed an API, so the 74
references stay and the rule changes.

### What the rule was

`scripts/check-docs.mjs` check [1] read `package.json`'s `version` and flagged
**any line containing that string** inside long-lived documents (`docs/**`,
root READMEs), exempting only `CHANGELOG.md` and `docs/history/`.

### Why it misfired

Occurrence is not semantics. While the current version was a prerelease string
(`0.2.0-rc.1`), the documents' references to the stable version did not match
the pattern, so the rule passed. Promoting the version to the stable release
made the very same lines match — because they name the release that the 0.2.0
legacy policy documents. The rule's own design doc said it was about
hardcoding; the implementation checked mere occurrence.

### What the rule protects now

A **version stamp**: a line that asserts the current version as the current
state, or pins it exactly — the forms that go stale at the next release:

- a version-asserting label bound to the version: `Version: <version>`,
  `Current release: <version>`, `当前版本：<version>`
- a metadata-table value: `| Version | <version> |`
- an exact package pin: `clarity-theme@<version>`
- a standalone version heading: `## <version>`
- an assertion sentence: `the latest version is <version>`

### What is explicitly allowed

- historical facts: `useClarityConfig was removed in 0.2.0`, `deleted in 0.2.0`
- migration mappings: `0.1.x → 0.2.0`, the legacy-policy table header
  `| 0.1.x | 0.2.0 |` (its label cell is another release line, not a version
  noun)
- install ranges: `^0.2.0`, `>=0.2.0 <0.3.0`
- release provenance: promotion records, release history

### Implementation

The matcher lives in `scripts/lib/version-stamps.mjs`
(`findVersionStamps(lines, version)`), imported by `check-docs.mjs`, so the
regression suite tests the same code the gate runs. There is **no allowlist**
and no filename exemption: the rule is pattern-based, and the pre-existing
`CHANGELOG.md` / `docs/history/` exemptions are unchanged.

### Regression tests

`tests/docs-governance.test.mjs` (wired into CI Layer 1 as
`test:docs-governance`) locks both directions:

- stamps that must keep failing — version-asserting labels, metadata-table
  values, exact package pins, standalone headings, assertion sentences;
- references that must keep passing — historical facts, migration mappings,
  install ranges, provenance, including the exact sentences that ship in the
  0.2.0 documentation;
- the twelve real bilingual documents listed in the original audit still
  contain zero stamps;
- `docs:check` exits 0 and reports `发现版本快照 0 处`.

### Result

| Metric | Before | After |
| --- | --- | --- |
| `docs:check` findings | 16 files / 74 occurrences | **0** |
| legitimate references rewritten | — | **0** |
| stamps still detectable | — | yes (regression-tested) |

`docs/maintainers/documentation.md` (+ `.zh-CN.md`) was updated to describe the
rule as it now behaves.

## 12. Final assessment

**`FINAL-RELEASE-READY`**

The single Phase 8 blocker was a documentation-governance false positive: the
rule checked version *occurrences* where its own design doc said it should
check version *hardcoding*. Phase 8.5 narrowed it to the stamp semantics it
always claimed, with regression tests locking both directions, and **zero**
legitimate references were rewritten.

Everything the release gate measures now passes: the upstream baseline is
confirmed unchanged, the package audits clean, the generated HTML is real and
byte-equivalent to the verified rc.2 build apart from the version stamp, source
and transform parity hold on the formal baseline, no removed API re-entered the
runtime, and CI is green.

**Not done, by instruction:** nothing published, no `v0.2.0` tag, no GitHub
Release, no merge to the main branch, no deletion of any release or rehearsal
branch, no upstream write, and no further phase started.
