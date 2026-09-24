---
name: migrate-blog-v3-to-clarity
description: Migrate an existing Nuxt 4 blog-v3 project to the Clarity Theme Layer while preserving articles, assets, redirects, patches, custom components, and user-specific integrations. Use when a user asks to migrate, convert, extract, or adopt Clarity Theme from blog-v3.
---

# Migrate blog-v3 to Clarity Theme

Use this skill to migrate a consumer project. It does not modify the Clarity Theme implementation and never treats user content as disposable. Read the referenced knowledge files before changing files:

- [`references/migration-map.md`](./references/migration-map.md)
- [`references/config-mapping.md`](./references/config-mapping.md)
- [`references/validation.md`](./references/validation.md)

## Clarity repository layout

Clarity Theme keeps its runtime source under `src/` (`src/components`,
`src/config`, `src/modules`, `src/server`, `src/shared`, …) while
`nuxt.config.ts` and `package.json` stay at the package root. The npm
subpath exports (`clarity-theme/config`, `clarity-theme/content`,
`clarity-theme/schema`, `clarity-theme/img`) are stable and point into
`src/`. Consumer projects keep their own blog-v3-shaped `app/`, `content/`,
and `public/` trees — do not mirror Clarity's internal `src/` layout into a
consumer, and do not rewrite consumer `app/**` paths during migration.

## Operating rules

- blog-v3 is the source of truth for UI, layout, and interaction: do not redesign, reformat, or generalize upstream-derived code during migration; upstream files in the Theme stay byte-identical except for the mechanical import rewrites recorded in `tests/upstream-parity.manifest.json` (enforced by `pnpm test:upstream-parity`).


1. Work serially in one Git working tree. Do not start concurrent dev, build, generate, or test processes.
2. Start with `git status --short --branch` and record the branch and HEAD.
3. If user modifications are already uncommitted, do not overwrite them. Produce an inventory and migration report instead.
4. Make reversible, explained edits. Prefer adding new Clarity entry files over rewriting unrelated user files.
5. Never redesign the Theme, regenerate article content, or “normalize” user data.
6. Read the project's actual source and lockfiles. Do not rely only on this Skill or prose documentation.

## 1. Discovery

Confirm that the target really is the supported Nuxt 4 blog-v3 family before planning. Inspect:

- `blog.config.ts`
- `content.config.ts`
- `nuxt.config.ts`
- `app/app.config.ts`
- `content/`
- `patches/`
- `package.json`
- `pnpm-workspace.yaml` and the lockfile
- `app/feeds.ts`, `redirects.json`, `server/`, custom modules, and custom components when present

Record the source package version, Git commit, Nuxt version, Node version, package manager, and whether the tested baseline differs. If the project is not blog-v3, or the baseline is materially different and cannot be reconciled with the mapping references, stop and explain the gap.

## 2. Inventory

Build a complete inventory before edits. At minimum include:

- site configuration and derived UI expressions
- article categories, types, ordering, permalink behavior, and robots rules
- integrations, analytics scripts, Twikoo, search, image services, and other external services
- UI configuration and custom component overrides
- feeds/friend data and helper functions
- redirects and custom route rules
- patches and package-manager registration
- custom modules, plugins, middleware, pages, layouts, components, composables, and stores
- server routes, server middleware, nitro plugins, and runtime configuration
- package scripts, deployment settings, prerender routes, and environment variables
- `content/` and `public/` data that must remain untouched

Use the inventory template in `references/migration-map.md`.

## 3. Classification

Classify every inventoried asset:

- `AUTO`: safe mechanical mapping documented by the references
- `REVIEW`: site-specific behavior requiring a human decision or test
- `KEEP`: preserve unchanged
- `NEVER_TOUCH`: do not edit or delete

Article bodies, frontmatter semantics, public assets, redirects, patches, unknown custom modules, and unknown server code are never automatically deleted or rewritten. A migration may only list and explain such items. Put uncertain user customization in `REVIEW` or `NEVER_TOUCH`; never guess.

## 4. Plan

Before applying changes, write a migration plan with one row per file or logical asset:

| File / asset | Current state | Target state | Reason | Risk | Human review |
| --- | --- | --- | --- | --- | --- |

For each row state the exact action: create, edit, move, keep, or report only. Include dependency/package-manager consequences and validation coverage. Reject the plan if it cannot preserve every `NEVER_TOUCH` item or if a required `REVIEW` decision remains unresolved.

When this Skill runs non-interactively, proceed only if every action is `AUTO` or `KEEP`; otherwise stop with the plan and questions. When interacting with the user, ask one concise set of questions for `REVIEW` items before applying.

## 5. Apply

Apply the approved plan in this order:

1. install the pinned/released Clarity package as a runtime dependency
2. reduce `nuxt.config.ts` to the Layer entry plus genuinely consumer-owned settings
3. create and validate `clarity.config.ts`
4. replace `content.config.ts` with `createClarityContentConfig()`
5. convert `app/app.config.ts` to UI-only `clarity.*` overrides
6. move friend groups to root `feeds.ts`
7. retain redirects and custom route rules
8. reconcile dependencies without removing still-used custom code
9. retain required patches and their package-manager registration
10. retain only intentional custom component overrides
11. retain custom server, plugin, module, and deployment code
12. leave `content/`, article bodies, frontmatter, and public assets untouched

Never:

- delete or rename articles
- edit article prose or frontmatter semantics
- delete public assets
- delete redirects
- delete patches
- delete an unknown custom module
- delete unknown server code
- copy user data into the Theme package
- copy all old application components over the Layer

If an unexpected conflict appears, stop, restore or preserve the user file, and update the report.

## 6. Validation

Run the commands serially from the consumer project:

```bash
pnpm install
pnpm typecheck
pnpm generate
```

If `typecheck` is not scripted, use `pnpm exec nuxt typecheck`. Then run every relevant existing project test and deployment preview. Confirm the representative routes and files listed in `references/validation.md`.

When validating the Clarity repository itself rather than a migrated consumer, run `pnpm test:compatibility` as well, followed by the Theme's current migration fixture check. Do not run multiple validation processes concurrently.

## 7. Migration report

Finish with a concise report containing:

- branch, initial HEAD, final HEAD, and working-tree status
- modified files
- added files
- deleted files, with an explicit safety explanation
- files intentionally kept unchanged
- special configuration retained by the consumer
- every `REVIEW` or `NEVER_TOUCH` item requiring human handling
- classification/plan deviations
- exact validation commands and results, including failures
- whether migration is complete

Do not claim success if typecheck, generation, or a required site-specific test failed. Do not omit failures or warnings that affect user-visible behavior.

## 8. Rollback

Before high-risk edits, confirm a clean tree and record the starting commit. Require a migration branch or explicit user instruction before proceeding.

If the tree was dirty at discovery, stop before edits. If an edit goes wrong, use the smallest safe Git restoration path for that file; never recursively discard a user working tree. Keep the original project or branch until representative routes, redirects, assets, patches, and integrations have passed validation.
