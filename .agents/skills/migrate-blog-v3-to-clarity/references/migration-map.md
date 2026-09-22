# blog-v3 → Clarity File Mapping

This reference describes file ownership and migration disposition. Field values are mapped in [`config-mapping.md`](./config-mapping.md). Always compare the target project with its recorded source baseline before deleting or replacing a file.

## Classification legend

- `AUTO`: documented mechanical transform
- `REVIEW`: requires comparing user changes or choosing site behavior
- `KEEP`: preserve unchanged
- `NEVER_TOUCH`: never rewrite or delete during migration

## File-level map

| Source | Target / action | Classification | Notes |
| --- | --- | --- | --- |
| `package.json` | Edit in place | `REVIEW` | Add Clarity as a runtime dependency; retain custom dependencies/scripts; remove generic dependencies only after imports and validation prove they are unused |
| `pnpm-lock.yaml` | Regenerate after dependency/patch decisions | `AUTO` | Inspect the diff; never hand-edit |
| `pnpm-workspace.yaml` | Edit only patch/catalog/workspace-specific sections | `REVIEW` | Preserve required `patchedDependencies`; Clarity does not carry patches |
| `nuxt.config.ts` | Replace blog application config with Layer entry plus consumer settings | `REVIEW` | Preserve redirects, custom modules/plugins/hooks, runtime config, deployment, custom route rules, and custom prerender |
| `blog.config.ts` | Create root `clarity.config.ts`; keep source during migration | `AUTO` then `REVIEW` | Remove runtime imports; delete the old file only after report/validation and user confirmation |
| `content.config.ts` | Replace with `createClarityContentConfig(clarityConfig)` | `REVIEW` | Preserve custom schema decisions; do not alter article data |
| `app/app.config.ts` | Convert to UI-only `clarity.*` overrides | `AUTO` | Remove the old full blog-config spread and all site-level fields |
| `app/feeds.ts` | Create root `feeds.ts` containing only friend groups | `REVIEW` | Do not migrate self-feed data; retain custom helpers only when friend entries depend on them |
| `redirects.json` | Keep in consumer and map into route rules | `KEEP` | Never move into Theme or change paths during migration |
| `edgeone.json` and deployment files | Keep consumer-owned | `KEEP` / `REVIEW` | Review only when Layer/deployment behavior changes |
| `content/**` | Stay in consumer | `NEVER_TOUCH` | Article bodies/frontmatter are not Theme migration inputs |
| `public/**` | Stay in consumer | `NEVER_TOUCH` | Preserve paths used by articles and external links |
| `patches/**` | Stay in consumer | `KEEP` / `REVIEW` | Registration and lockfile must remain consistent; inactive patches need review |
| `app/components/content/**` | Same consumer path only for intentional custom overrides | `REVIEW` | Unchanged generic components should be supplied by the Layer |
| `app/components/blog/**`, `post/**`, `widget/**` | Same consumer path only for intentional custom overrides | `REVIEW` | Prefer UI config when possible |
| `app/components/partial/**`, `popover/**`, `util/**` | Same path override is possible but less stable | `REVIEW` | Treat as internal unless already customized |
| `app/pages/**`, `layouts/**` | Keep custom/changed routes; let Layer provide unchanged generic routes | `REVIEW` | A leftover unchanged file can freeze an old Layer route |
| `app/plugins/**`, `middleware/**` | Keep custom behavior; avoid duplicate generic plugins | `REVIEW` | Register only what consumer still needs |
| `app/composables/**`, `stores/**`, `utils/**`, `types/**` | Keep custom code; remove only proven generic duplicates | `REVIEW` | Update old config imports to public Clarity APIs |
| `app/assets/**` | Keep custom assets/site CSS; let Layer provide generic assets | `REVIEW` | Add a small consumer stylesheet rather than copying Theme CSS |
| `app/shiki.config.ts` | Keep if intentionally customized | `REVIEW` | Presence always overrides the Theme fallback |
| `app/app.vue`, `app/error.vue` | Keep only intentional overrides | `REVIEW` | Owning these files means owning future upgrades |
| `modules/**` | Custom modules stay; generic anti-mirror module is superseded | `REVIEW` | Use `features.antiMirror`; never delete an unknown module |
| `remark-plugins/**` | Generic plugins are Layer-owned; custom plugins stay | `REVIEW` | Avoid duplicate Markdown registrations |
| `server/**` | Custom routes/middleware stay; generic stats/Atom/OPML outputs are Layer-owned | `REVIEW` | Resolve route collisions explicitly |
| `shared/**` | Generic code is Layer-owned; custom shared code stays | `REVIEW` | Update imports only with type evidence |
| `scripts/**` | Keep article scaffolding and site maintenance scripts | `REVIEW` | Update config imports/paths; do not delete automatically |
| `tsconfig.json`, lint/style/cspell config | Stay consumer-owned | `KEEP` / `REVIEW` | Adjust only for new source layout or package resolution |
| `.vscode/**` | Stay consumer-owned | `KEEP` | Not Theme payload |

## Boundary summary

Clarity owns generic application UI, Content pipeline, styles, pages, composables, stores, remark plugins, and generic server outputs. The consumer owns all site identity, articles, friend data, redirects, deployment, secrets, custom code, public assets, and patches.

A source file must not be deleted merely because a target exists. Deletion is allowed only when all of the following hold:

1. the file is provably unchanged generic baseline code or a generated lockfile;
2. no consumer import or route depends on it;
3. removal does not alter a `NEVER_TOUCH` path;
4. the plan records the exact reason; and
5. typecheck/generate and targeted route tests pass afterward.

## Inventory template

Copy this table into the migration plan. Add every relevant file or logical asset; do not collapse user data into a generic row.

```text
Branch / HEAD:
Source version:
Runtime:

| Path | Detected purpose | User change evidence | Classification | Action | Risk | Validation | Human review |
| --- | --- | --- | --- | --- | --- | --- | --- |
```

Useful evidence commands:

```bash
git status --short --branch
git log --oneline --decorate -10
git diff --stat <source-baseline>..HEAD
git ls-files
```

When the source baseline is available as a Git object, compare each uncertain file:

```bash
git diff -- <path>
git diff <source-baseline>..HEAD -- <path>
```

## Recommended order

1. Inventory and classify.
2. Write and review the plan.
3. Add Clarity dependency.
4. Create `clarity.config.ts`.
5. Replace `content.config.ts`.
6. Convert `app/app.config.ts`.
7. Reduce `nuxt.config.ts` while preserving consumer route/runtime settings.
8. Move friend groups to `feeds.ts`.
9. Reconcile custom components/modules/server files one by one.
10. Reconcile dependencies and patches.
11. Install/typecheck/generate serially.
12. Run targeted manual tests and produce the report.

This order keeps original user data untouched while establishing the new public entry points.
