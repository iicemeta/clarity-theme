# Source Layout Migration Issues / REVIEW

> **Historical record — not authoritative for current architecture.** Current
> facts live in [architecture](../concepts/architecture.md) and
> [project status](../maintainers/project-status.md).

> Branch: `refactor/source-layout` · Base: `1a703eb` · Date: 2026-09-22

This file records migration-specific findings, intentional REVIEW decisions,
and Windows-only test-runner issues that were **not** silently changed into
unrelated Theme rewrites.

## Status summary

| ID | Status | Issue | Disposition |
| --- | --- | --- | --- |
| M1 | Fixed | Static layer directory keys leak into consumer root config | Replaced static `srcDir`/`serverDir`/`dir.*` declaration with `src/modules/clarity-source-layout` |
| M2 | Fixed | Remark-plugin TypeScript files lacked `mdast` type declarations after entering the TS project | Added dev dependency `@types/mdast@^4.0.4` |
| R1 | REVIEW | `clarity-source-layout` must update cached Nuxt layer metadata in place | Required by Nuxt 4.5.2; revisit if Nuxt exposes a layer-directory invalidation API |
| R2 | REVIEW | `typescript.nodeTsConfig.include` remains a dead pattern in layer context | Preserve previous semantics and update prefixes only |
| R3 | REVIEW | Historical documents intentionally retain pre-migration paths | Historical snapshots are not rewritten |
| W1 | Windows-only | One Nitro prerender invocation exited with status `3221226505` | Same source and consumer succeeded on retry; full consumer variants ultimately passed |
| W2 | Windows-only | `test-consumer` cleanup hit `EPERM` after all assertions passed | Record as test-runner cleanup issue; do not mask it in Theme code |
| W3 | Windows-only | First full compatibility run hit a Shiki timing race and a Nuxt dev-lock race | `--no-build` rerun passed all 52 assertion groups |

## M1 — Layer directory configuration leakage

### Finding

The initial implementation statically declared these keys in the theme layer:

```ts
srcDir: 'src'
serverDir: 'src/server'
dir: {
	modules: 'src/modules'
	public: 'src/public'
	shared: 'src/shared'
}
```

Nuxt 4.5.2 normalizes these keys for each layer, and the Clarity layer itself
resolved `src/` correctly. However, c12 merges the layer values into the final
root config before per-layer normalization. A consumer that does not explicitly
override these keys therefore inherited:

- `srcDir: <consumer>/src` instead of its auto-detected application directory;
- `serverDir: <consumer>/src/server`;
- root `modules/` and `public/` directories under `<consumer>/src`;
- a relative `dir.shared` value that consumers resolved against their own root.

The generated consumer tsconfig confirmed polluted `~`, `#server`, and
`#shared` aliases. An initial consumer generate also crashed during Nitro
prerender initialization with Windows status `3221226505`.

### Resolution

`nuxt.config.ts` no longer statically declares these directory keys.
`src/modules/clarity-source-layout` is installed first and:

1. finds the Clarity layer by its package `rootDir`;
2. assigns `src/`, `src/server/`, `src/modules/`, `src/public/`, and
   `src/shared/` to that layer's config;
3. updates the layer's cached `app`, `appPages`, `appLayouts`,
   `appMiddleware`, `appPlugins`, `modules`, `public`, `server`, and
   `shared` directory metadata.

The cached update is necessary because Nuxt calls `getLayerDirectories()`
before installing modules and exposes no public invalidation API. Consumer
root config now keeps its auto-detected `app/`, `server/`, `public/`,
`modules/`, and `shared/` directories.

## M2 — Missing `mdast` declarations

After `remark-plugins/` moved under the TS project, TypeScript checked
`remark-code-component.ts` and `rehype-meta-slots.ts` through the playground
project. Their `unist` node types require `@types/mdast`. The migration added
only the missing type package; no runtime dependency or plugin behavior was
changed.

## R1 — Cached layer metadata mutation

`LayerDirectories` fields are public metadata but readonly in the Nuxt 4.5.2
type declaration. `clarity-source-layout` uses `Object.assign` on the cached
plain object after configuring `layer.config` because there is no supported
`layerMap.delete()` / invalidate API.

This module is intentionally first in `modules` and must remain versioned with
the Nuxt 4.5 compatibility contract. If a future Nuxt version exposes an
official API for changing layer directories after config load, replace this
internal-cache handling with that API.

## R2 — `nodeTsConfig.include` dead pattern

`typescript.nodeTsConfig.include` paths are resolved relative to the consumer
build directory. In a distributed layer they were already ineffective before
this migration. The migration preserves that behavior and only changes the
prefixes from `../config/**` / `../remark-plugins/**` to
`../src/config/**` / `../src/remark-plugins/**`. No attempt was made to change
Nuxt's tsconfig generation semantics.

## R3 — Historical documents

The following are historical records or release snapshots and intentionally
keep the paths that were accurate when they were written:

- `docs/**/theme-audit*`;
- `docs/**/config-api-audit*`;
- `docs/**/patch-audit*`;
- `docs/**/RELEASE-AUDIT*`;
- historical `RELEASE-NOTES` / `PUBLISHING` material;
- `docs/history/**`;
- `CHANGELOG.md`.

Current architecture, API, configuration, customization, upstream-sync,
project-status, roadmap, and README documentation were updated.

## W1 — Intermittent Windows Nitro prerender fast-fail

One isolated consumer `nuxt generate` and one full `test:consumer` invocation
exited with Windows status `3221226505` after `Initializing prerenderer`,
without a JavaScript stack. A subsequent generate using the same source and
consumer completed all 43 routes, and the final full consumer run completed
default/branches/features-off generates plus the runtime server assertions.

This appears to be a builder/prerenderer or Windows process-lifecycle issue,
not a deterministic source-layout failure. It should be revisited only with a
reproducible stack or upstream Nuxt/Nitro issue; dependency upgrades were not
performed to mask it.

## W2 — Consumer test cleanup EPERM

The final full `pnpm test:consumer` run printed its success summary after all
ten stages and all variant assertions passed:

> `✔ Real Consumer Test 通过：tarball 边界、exports、类型、独立安装、3 组配置分支的 generate 产物全部符合发布标准`

The script then failed only while deleting its Windows temporary directory:

```text
EPERM: Permission denied
```

The failure occurred after validation and did not alter the tarball or
consumer result. The script's cleanup logic was not changed as part of this
source-layout migration.

## W3 — Compatibility timing and dev-lock races

The first full compatibility run passed production build, all SSR cases, dev
hydration, and all but two browser/runner checks:

- `B-code-client` briefly had fewer than 15 Shiki line nodes when evaluated;
- the anti-mirror dev server started before the preceding Nuxt dev process had
  fully released its Windows lock (`Another Nuxt dev server is already running`).

The reported PID disappeared shortly afterward. A rerun with `--no-build`
against the same successful production build passed all 52 assertion groups,
including Shiki and the real anti-mirror navigation. Existing non-fatal Vue
and unhead dev warnings remain outside this migration's scope.
