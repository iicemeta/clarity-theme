# Release Candidate 2 Promotion Record

**English** | [简体中文](./rc2-promotion.zh-CN.md)

The upstream update rehearsal found several defects in Clarity's own
synchronization infrastructure. This page records which of those findings were
promoted into the second release candidate of the 0.2.0 line, which were left
behind on the rehearsal branch, and why.

The rule applied throughout: **only changes that are Clarity-owned and
independent of the rehearsed upstream content may be promoted.** The reviewed
upstream baseline must not move.

## 1. Base

| Item | Value |
| --- | --- |
| rc.1 commit | `085edce` |
| rc.2 head | the rc.2 release branch — rc.1 plus the promoted commits in §3 |
| Promoted commits | `461d812`, `010b5ef`, `1b34fcc`, `b765502`, `80c06fb` |
| Version | the second release candidate of the 0.2.0 line |
| **Upstream baseline (unchanged)** | `f6ea97d745517feb52f0c100e89acb36f0adc12f` — upstream 3.7.2 |
| Rehearsal target (not promoted) | upstream development branch at `8d5b4aaa6f1a2ca8076d42a17d54ab426059fc08` — upstream 3.8.0 |

Note on the documentation governance rules: the current version string may not
appear under `docs/` outside the changelog and frozen history, so this record
names the release line and the branch conceptually rather than quoting the
literal version. The root changelog and `git log` on the rc.2 branch are
authoritative for the exact version and head.

## 2. Rehearsal findings

The rehearsal is recorded on the `rehearsal/upstream-update` branch
(`docs/maintainers/upstream-update-rehearsal.md`). Eight defects were found.
Six of them are Clarity-owned and promoted; two are tied to the rehearsed
upstream content and stay behind.

| # | Defect | Class |
| --- | --- | --- |
| 1 | Declared mechanical transforms could not be applied: the sync tool knew nothing about the parity manifest, so every mechanically rewritten file looked "locally adapted" and aborted the whole transactional apply. No realistic upstream update could be synced. | **promoted** |
| 2 | Newly added upstream files were written verbatim, so an added file importing a consumer alias would land broken. | **promoted** |
| 3 | Boundary / bugfix files surfaced as "unclassified", blocking apply with a misleading instruction to edit the manifest. | **promoted** |
| 4 | Three upstream root files had no classification and blocked every apply (`README.md`, `pnpm-lock.yaml`, `MIGRATION.md`). | **promoted** |
| 5 | A declaration invalidated by an upstream refactor left an unexplained conflict with no way to record the human decision. | **promoted** |
| 6 | There was no way to target an upstream ref other than the manifest branch, which made a rehearsal impossible in the first place. | **promoted** |
| 7 | `commitManifest` appended a trailing newline to a `*.json` file, violating the repository's lint rule on every sync. | **promoted** |
| 8 | The sync test harness spawned children with the default `stdio`, so all 18 tests reported `status: null` on Windows hosts and the suite was silently unverifiable. | **promoted** |

Defect 7 and 8 are pure correctness/portability fixes in Clarity's own
tooling and tests. Defect 8 is the same class of omission as the one Phase 5
fixed in `scripts/`: the implementation was hardened, the harness that spawns
it was not.

## 3. Promoted

Three files enter the release candidate, plus release metadata.

| File | Change | Tests | Why generic |
| --- | --- | --- | --- |
| `scripts/sync-upstream.mjs` | expected local state is now `<baseline + declared replacements>`; declared transforms run on newly added files too; a stale declaration fails loudly; `boundary`/`bugfix` files get their own blocking bucket; `--ref <branch>`; `--accept <path>`; no trailing newline on the manifest | `tests/sync-upstream.test.mjs` | The tool reads the parity manifest generically. Nothing in it refers to the rehearsed upstream content; it behaves identically against the current baseline. |
| `tests/sync-upstream.test.mjs` | pinned `stdio` for child processes; one raw `execFileSync` routed through the hardened helper; 7 new regression tests (18 → 25) | itself | Test-harness portability plus coverage of the promoted behaviour. |
| `sync-manifest.json` | `README.md` and `pnpm-lock.yaml` declared `exclude`; `MIGRATION.md` declared `manual` | covered above | Surface-classification entries only. They contain no upstream content, and they are inert against the current baseline — `MIGRATION.md` does not even exist there. |
| `package.json` | version → the rc.2 release candidate | — | Release metadata. |
| `CHANGELOG.md` | rc.2 entry describing the promoted infrastructure | — | Release metadata. |
| `docs/maintainers/project-status.md` (+ `.zh-CN.md`) | sync-tool capability and the remaining manual-review limitation | — | Documentation. |
| `docs/maintainers/rc2-promotion.md` (+ `.zh-CN.md`) | this record | — | Documentation. |

Verification that the promotion is content-free with respect to upstream:

- `scripts/sync-upstream.mjs` and `tests/sync-upstream.test.mjs` are
  **byte-identical** to the rehearsal branch.
- `sync-manifest.json` differs from the rehearsal branch **only** in
  `upstream.commit`, `upstream.version` and `upstream.syncedAt` — the baseline
  metadata, which was deliberately not promoted.

## 4. Kept in rehearsal

Everything below exists only on `rehearsal/upstream-update` and is **not** in
this release candidate.

| Area | Files | Why kept |
| --- | --- | --- |
| Upstream source tree | 96 files under `src/` (components, composables, pages, plugins, styles, stores, utils, shared) | Upstream content. The Theme is not tracking 3.8.0. |
| Style-entry rename | `assets/css/*.scss` → `.css`, `animation.css` added, `_variable.scss` removed | Upstream 3.8.0 content. |
| Transform adaptations | `nuxt.config.ts`, `eslint.config.mjs`, `package.json` (`postcss-nesting`), `pnpm-lock.yaml`, `stylelint.config.mjs` | 3.8.0-specific transform review. Each only makes sense against the 3.8.0 source and the 3.8.0 baseline. |
| Parity declarations | `tests/upstream-parity.manifest.json` | Tracks the 3.8.0 composable split. Promoting it would break source parity at the current baseline: `useArticle.ts` still imports `~/types/article` there. |
| Rehearsal record | `docs/maintainers/upstream-update-rehearsal.md` (+ `.zh-CN.md`) and its index entry | Describes the 3.8.0 delta. Kept with the rehearsal it documents so the release candidate does not imply 3.8.0 coverage. |
| 3.8.0 transform registry | `docs/maintainers/transform-parity.md` (+ `.zh-CN.md`), `docs/guides/customization.md` (+ `.zh-CN.md`) | The registry rows, the `postcss-nesting` row, the `vite.css.additionalData` DROP, and the `_variable.scss` guidance are all 3.8.0-specific and would be wrong against the current baseline. |

### Deferred, not promoted

One generic fix was found inside a 3.8.0-specific file and was **not**
promoted, because it is not synchronization infrastructure and rule 12 says to
leave uncertain changes behind:

- `docs/maintainers/transform-parity.md` (+ `.zh-CN.md`): the line describing
  `clarity-config` still lists a removed 0.1.x app-config key as one of its
  injection sources. That is a stale sentence left over from the 0.2.0 legacy
  removal, not a sync concern. It should be corrected in a documentation pass,
  not smuggled in with a sync promotion.

Also deliberately left out of scope: the rehearsal's deferred dependency
cleanups (Stylelint toolchain, the vestigial `@nuxt/a11y` devDependency) and
the `sass-embedded` retention decision. All three are consequences of the 3.8.0
transform review, so they stay with it.

## 5. Verification

| Gate | Result | Notes |
| --- | --- | --- |
| lint | **PASS** | 0 errors, 0 warnings |
| docs | **PASS** | `docs:check`: 120 paired documents, 629 links, 8 changelog sections, no version pollution |
| typecheck | **PASS** | 0 TypeScript errors |
| verify | **PASS** | impurity audit clean |
| source parity | **PASS** | against the formal baseline `f6ea97d`: 120 files, 103 `identical` / 16 `mechanical` / 9 `boundary` / 1 `bugfix` — **identical to rc.1; no class relaxed** |
| transform parity | **PASS** | 6/6 |
| sync tool regression | **PASS** | 25/25 (18 before the rehearsal) |
| sync baseline check | **PASS** | `sync:verify` reports the baseline equals upstream `main` — proof the rehearsal baseline was not carried over |
| config / migration / contract | **PASS** | all three |
| peer audit | **PASS** | no issues |
| consumer (outside-repo tarball) | **BLOCKED locally** | fresh `pnpm install` fails in `esbuild`'s postinstall on this host. Verified on CI. |
| generate (playground) | **PASS** | 51 prerendered routes; real HTML for `/`, `/archive`, `/link` and the article page |
| runtime parity | **BLOCKED locally** | the harness cannot resolve this host's pnpm installation. Verified on CI. |
| visual parity | **NOT RUN** | nightly/dispatch diagnostic by design, excluded from the PR gate |
| pack / release check | **PASS** | tarball audited, no boundary violations, version consistent |
| CI | see the branch's pull-request run | the acceptance signal for the two gates that cannot run locally |

Local results and CI results are reported separately on purpose: this host
cannot create symlinks, cannot spawn children with a piped `stdio`, and cannot
complete a fresh dependency install, so the consumer and runtime-parity gates
have no local verdict. They are not claimed as passing.

## 6. Baseline integrity

| Concept | Commit | Where |
| --- | --- | --- |
| Formal release baseline | `f6ea97d745517feb52f0c100e89acb36f0adc12f` (upstream 3.7.2) | `sync-manifest.json` on this branch |
| Rehearsal target | `8d5b4aaa6f1a2ca8076d42a17d54ab426059fc08` (upstream 3.8.0) | `sync-manifest.json` on `rehearsal/upstream-update` only |

The two are not interchangeable and were not confused. Evidence:

- `sync:verify` passes on this branch, which requires the manifest baseline to
  equal upstream `main`. It failed on the rehearsal branch by design.
- Source parity resolves its upstream content from the manifest commit and
  reports `f6ea97d` (3.7.2) with the same class counts as rc.1.
- `sync-manifest.json` is byte-identical to rc.1 apart from the three
  classification-list additions in §3.

## 7. Final assessment

**`RC2-READY`**

Promoted: the generic synchronization infrastructure and its regression tests,
plus release metadata and documentation. Not promoted: any upstream content,
any transform change that only holds against the rehearsed upstream baseline,
and the rehearsed baseline itself.

Every gate that can run on this host passes, source parity is unchanged from
rc.1, and the formal baseline is provably intact. The two gates that cannot run
here are deferred to CI and are recorded as blocked rather than assumed green.

**Not done, by instruction:** nothing published, no formal 0.2.0 release, no
merge to the main branch, no merge of the rehearsal branch, no deletion of the
rehearsal branch, no upstream write, no further phase started.
