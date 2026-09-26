# Consumer Patches

**English** | [简体中文](./patches.zh-CN.md)

## Purpose

Four upstream blog-v3 patches change article rendering. The Theme ships none of them — pnpm patches are consumer workspace state and cannot travel through an npm package. When one of these behaviors matters to your content, register the patch in the consumer; otherwise expect the unpatched behavior documented here.

## Capability matrix

| Behavior | Without patch (Theme default) | With consumer patch | Patch |
| --- | --- | --- | --- |
| Fenced-code tab preservation | MDC's `detab` converts tabs to spaces | Tab characters reach Shiki verbatim | `@nuxtjs/mdc` (detab hunk only) |
| Fractional image densities | String densities like `"1.5x"` parse as integers | `parseFloat` keeps fractional values | `@nuxt/image` |
| Plain Shiki highlight scope | `::highlight(name)` selector misses descendants | Selector includes descendant combinator | `plain-shiki` |
| ICO passthrough | ICO through IPX fails in Sharp | ICO passes through untransformed | `ipx` |

## Inline code note

The upstream `@nuxtjs/mdc` patch also passed inline-code text as a `code` prop. The Theme's `ProseCode` implements dual-mode support (prop when present, slot text otherwise), so that hunk is no longer needed — see [inline code](../components/inline-code.md).

## When to Use

- Tab-preservation: code-heavy articles that depend on tab-aligned content (e.g. tab-indented source displayed verbatim). Prefer spaces in new writing.
- Densities: content that passes fractional `densities` strings to image components.
- The other two: only when the specific rendering bug is observed.

## When Not to Use

Do not register patches speculatively; each one is a maintained fork of a dependency in your lockfile. See the maintainer [patch strategy](../../../maintainers/patches.md).

## Common Mistakes

- Assuming the Layer can ship patches for you — it cannot.
- Copying patch files without registering them in `pnpm-workspace.yaml` `patchedDependencies` (the upstream `@vue/shared` file is present but unregistered, and inert).

## Support Status

`conditional` — each behavior is available only in consumers that register the corresponding patch. The Theme-side defaults are `supported` and fixture-verified.

## Source

Upstream `patches/` and `pnpm-workspace.yaml`; Theme boundary documented in `docs/maintainers/patches.md`; historical audit in `docs/history/2026-09-patch-audit.md`.
