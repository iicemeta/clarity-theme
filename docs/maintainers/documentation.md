# Documentation Rules

**English** | [简体中文](./documentation.zh-CN.md)

These rules govern how the Clarity Theme documentation system is maintained. `pnpm docs:check` (see `scripts/check-docs.mjs`) enforces the mechanical subset in CI.

## Documentation source of truth

When any document disagrees with reality, precedence is:

1. current source code
2. `package.json` / `pnpm-lock.yaml` / `pnpm-workspace.yaml`
3. automated tests and compatibility contracts
4. GitHub Actions workflows
5. `sync-manifest.json`
6. documentation

Never "fix" code to match stale prose unless the change is required to make the documentation true, and record the reason. Existing documents are audit material, not fact sources — revalidate against code before editing.

## Version rule

**Release versions are recorded in `CHANGELOG.md`; long-lived documents may reference a release, but must not stamp the current one.**

- Release version, date, Added/Changed/Fixed/Breaking Changes, and migration notes belong in the root `CHANGELOG.md`, newest release first, in strictly descending SemVer order (`docs:check` verifies the order; an optional `## Unreleased` section may sit above the newest release).
- `create-clarity-theme` keeps its own `create-clarity-theme/CHANGELOG.md`; the Theme changelog never describes creator releases and vice versa.
- Long-lived documents (README, `docs/**` outside `history/`) must not **stamp** the current Theme release version — a version-asserting label (`Version: <version>`, `Current release: <version>`, `当前版本：<version>`), a metadata-table value (`| Version | <version> |`), an exact package pin (`clarity-theme@<version>`), or a standalone version heading. Write `<version>`, `v<version>`, or `clarity-theme@<version>` placeholders instead. A stamp goes stale at the next release.
- Not stamps, therefore allowed: historical facts (`useClarityConfig was removed in 0.2.0`, `deleted in 0.2.0`), migration mappings (`0.1.x → 0.2.0`), install ranges (`^0.2.0`, `>=0.2.0 <0.3.0`), and release provenance (promotion records). Naming the release that removed an API is required documentation — `docs:check` distinguishes these from stamps.
- Compatibility versions (Node, Nuxt, Vue, Nuxt Content, pnpm, upstream blog-v3 baselines) are technical reference data, not release versions — they stay allowed in requirements/compatibility/maintainer pages.
- Historical release incidents and one-time evidence belong in the changelog entry for that release or in `docs/history/` — never in publishing/checklist process documents.
- Do not create per-version files such as `RELEASE-NOTES-*.md`, `VERSION-*.md`, or `CHANGELOG-*.md`; `docs:check` fails on new ones.

## Audience rule

| Audience | Needs |
| --- | --- |
| Users | Create, install, migrate, configure, and run a blog |
| Developers | Integrate with the package/Layer API and outputs |
| Maintainers | Develop, test, sync, document, release, and audit the Theme |
| Agents | Locate architecture, API, tests, migration skill, sync, release, and documentation rules quickly |
| History | Frozen one-time records, explicitly non-authoritative |

Every page states or clearly implies its audience; do not mix them in one file.

## Document placement rule

| Content | Location |
| --- | --- |
| What Clarity is, key paths, quick start, top-level feature summary | `README.md` (landing page — keep it small; link out instead of inlining references) |
| First-time setup and migration walkthroughs | `docs/getting-started/` |
| How to use a feature day-to-day | `docs/guides/` |
| Exact API/output/compatibility contracts | `docs/reference/` |
| Mental models and design boundaries | `docs/concepts/` |
| How to develop, test, sync, publish, and govern the repo | `docs/maintainers/` |
| One-time audits, migration reports, phase narratives | `docs/history/` |

Rules of thumb:

- README answers "what is this / how do I start / where are the docs" in under a minute and links to the wiki for everything else.
- Reference pages describe contracts, not tutorials; guides describe tasks, not exhaustive type listings.
- Maintainer pages describe permanent processes with `<version>` placeholders — never a specific release's evidence, timestamps, or counts.
- History pages open with a "historical record — not authoritative" note and may cite versions and paths that no longer exist.

## Bilingual rule

User-facing documentation uses `foo.md` (English) + `foo.zh-CN.md` (Chinese) sibling pairs:

1. Both language versions share the same information architecture and heading levels.
2. Code examples and feature lists must be equivalent — no side may drop actual feature information.
3. New user-facing documents are added bilingually by default; `docs:check` verifies pairing (history pages are exempt as frozen records; Chinese translations of audits may be added voluntarily).
4. Wording may be natural translation, but links must point to the same document in the other language.

## Generated docs rule

- `docs/reference/compatibility.md` is generated from `compatibilityContract` in `scripts/compatibility-cases.mjs`. Regenerate with `node scripts/test-compatibility.mjs --update-docs`; never hand-edit the tables. `pnpm test:contract` fails when the file is out of sync. The Chinese sibling is a manually synced translation snapshot — update it whenever the English file is regenerated.
- Do not introduce new generated documents without a check that fails on drift.

## Docs validation

`pnpm docs:check` runs in CI (Layer 1) and verifies:

1. long-lived documents do not **stamp** the current `package.json.version` — version-asserting labels, metadata-table values, exact package pins, or standalone version headings; historical, migration, install-range and provenance references are allowed;
2. no `RELEASE-NOTES-*.md`, `VERSION-*.md`, or `CHANGELOG-*.md` files exist;
3. bilingual files are paired (outside `docs/history/`);
4. relative Markdown links resolve to real files;
5. changelog release sections are in descending SemVer order;
6. README size stays reasonable (warning, not failure).
