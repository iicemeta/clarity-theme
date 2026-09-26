# Release Record — Formal 0.2.0 (Phase 9)

**English** | [简体中文](./release-0.2.0.zh-CN.md)

Provenance record of the formal npm publication. This is a source-of-record
document: every version reference below describes *this* publication, not the
current state of the repository. Secret material (tokens, account credentials)
is intentionally excluded.

## Publication facts

| Item | Value |
| --- | --- |
| Release branch | `release/0.2.0` |
| Tag | `v0.2.0` (annotated, tag object `5911f20`) |
| Tagged commit | `f941e9e26194c4c9193eb1aeefeac04e8e5d58a5` |
| Merge to default branch | PR #7 merged (merge commit `cb49c703c26c807a0bc4abb27b453e50a428af87`) |
| Upstream baseline | `f6ea97d745517feb52f0c100e89acb36f0adc12f` — re-verified against `upstream/main` immediately before tagging |
| Package name | `clarity-theme` |
| Published package version | `0.2.0` |
| GitHub Release | https://github.com/iicemeta/clarity-theme/releases/tag/v0.2.0 (notes derived from the CHANGELOG 0.2.0 section) |

## Pre-flight gates (all PASS before tagging)

- Working tree clean; branch `release/0.2.0` in sync with origin.
- `upstream/main` == `f6ea97d…` (unchanged since the final release gate).
- npm registry check: the `0.2.0` slot was empty before publication.
- Publication path decision: the repo's `publish.yml` owns npm publishing
  (GitHub Release → OIDC Trusted Publishing); no manual `npm publish` was run.
- Tarball audit: local `pnpm pack` produced `clarity-theme-0.2.0.tgz`
  (SHA-256 `39fd40de9242df96468189d60c31b70a34fc50422398205dfe4ee1368ad65435`,
  107,164 bytes). File boundary clean (`src/generated` absent, no lockfiles or
  private files); all nine export entries resolve to files present in the
  tarball.

## Publication run

`publish.yml` run [36228406132](https://github.com/iicemeta/clarity-theme/actions/runs/36228406132)
triggered by the GitHub Release. Every step completed successfully: full
ordered verification (lint, typecheck, theme purity, sync regression, migration
regression, compatibility contract, peer audit, playground static generation,
real tarball consumer, SSR/browser/hydration compatibility, release gate),
final pack, tarball audit, publish dry-run, and the OIDC publish itself. No
long-lived npm token is involved at any point.

## Registry state after publication

- Registry version `0.2.0` is present; `dist-tags.latest` resolves to it.
- Registry tarball: `https://registry.npmjs.org/clarity-theme/-/clarity-theme-0.2.0.tgz`
  with `dist.integrity` `sha512-sycqr5/or8lvW91iL2y7viEEbGoZ2RRy/+UP5u90fgNAnwJrZwSeXNgiv6tk5bQF7ugQOnOUACH7osVlNS3/vg==`.
- Content parity check: the registry tarball and the locally packed release
  tarball were unpacked and compared recursively — identical file inventory
  (157 files) and byte-identical content after normalising line endings. The
  only byte differences are CRLF/LF on `LICENSE` and `README.zh-CN.md`, caused
  by the platform difference between the local Windows pack and the CI Linux
  pack. No content drift.

## CI evidence on the release head

- CI run 36226174061 on `f941e9e`: 10/10 checks green, including the real
  consumer job (pack → outside-repo install → exports/typecheck/generate
  assertions) and the Windows `file:` install generation job.
- Parity workflow (runtime + visual) dispatched separately on the same line of
  work: run 36225501055, PASS.

## Fresh registry consumer

An outside-repository consumer (`final-npm-consumer/`, no workspace or
`file:`/`link:` references) was created and pointed at the registry package:

- `pnpm add` of the registry package — PASS (lockfile records registry
  integrity, not a local reference).
- Export smoke across `.` / `./config` / `./content` / `./schema` / `./img` —
  5/5 resolvable — PASS.
- `nuxt typecheck` — exit 0 — PASS. (The consumer carries the five upstream
  dependency patches that the creator template and the documented patch
  strategy place on consumers; this matches the repo's own consumer
  acceptance template.)
- Full `generate` / `build` / `dev` rendering locally on this maintainer's
  Windows machine — **BLOCKED by the local environment**, not by the package:
  the WorkBuddy agent sandbox hooks `fs.rm` (safe-delete shim), which aborts
  Nuxt's build-directory cleanup, and its `genie-trash` helper times out on
  `spawnSync`. The same block reproduces with the in-repo playground, so the
  theme cannot be blamed or exonerated for the residual `#modals` vite
  transform warning seen locally; it is recorded in the follow-ups below.
  The equivalent rendering evidence for this exact payload exists in CI
  (playground generation, tarball consumer generation with page-level
  assertions, and the compatibility suite — all green in run 36228406132).

## Follow-ups recorded (no action taken in Phase 9)

- The local-only `#modals` vite transform resolution failure deserves a look
  on a non-sandboxed Windows machine; CI (ubuntu consumer + Windows `file:`
  generation) does not reproduce it.
- The repository's `test:registry-consumer` consumer template does not carry
  the five upstream dependency patches that `test:consumer` embeds; its
  typecheck step will fail for the same temporal-spec typing reason until the
  two templates are aligned.

## Final status

**PUBLISHED.** The `0.2.0` payload is verifiably the audited artifact, the
registry serves it, the default branch contains the release commit, and the
tag points at it.
