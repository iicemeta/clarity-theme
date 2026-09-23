# Pic

**English** | [简体中文](./pic.zh-CN.md)

## Purpose

A rich image: Nuxt Image processing, optional caption, and lightbox zoom on click.

## Basic Syntax

```mdc
::pic{src="https://example.com/photo.jpg" caption="A caption"}
::

::pic{src="/img/local.webp" width="600"}
#caption
Rich caption with **Markdown**.
::
```

Plain Markdown images (`![alt](https://example.com/photo.jpg)`) also render through the image pipeline (figure markup, Nuxt Image srcset), verified by compatibility case `D-image`. Use `::pic` when you need a caption, size control, or zoom options.

## Props

`UtilImgProps` plus Pic's own (source: `src/components/util/Img.vue`, `Pic.vue`):

| Prop | Type / default | Notes |
| --- | --- | --- |
| `src` | string, required | Image URL |
| `alt` | string, default `''` | Alt text |
| `caption` | string | Plain caption; the `#caption` slot overrides it |
| `width` / `height` | string \| number | Intrinsic size hints |
| `densities` | string | e.g. `"1x,2x"`; fractional values need the consumer image patch |
| `mirror` | `ImgService` | Image mirror: `baidu` \| `fly` \| `weserv` \| `true` |
| `filter` | string | CSS filter |
| `zoom` | boolean, default `true` | Lightbox on click |

## Slots

- `caption` — rich caption; overrides the `caption` prop

## Supported Values

Local paths get the app base URL prefix; remote URLs pass through, optionally mirrored.

## Examples

```md
::pic{src="https://placehold.co/600x300" caption="Pic caption"}
::
```

## Nesting

Standalone block; do not nest containers inside.

## When to Use

Images that need captions, sizing, or zoom — screenshots, diagrams, photos.

## When Not to Use

Every inline image; plain Markdown syntax already goes through the pipeline.

## Common Mistakes

- Forgetting `alt` — accessibility suffers.
- Enabling `mirror` for images you control.

## Support Status

`supported` — verified by compatibility case `D-image` (Markdown image and Pic).

## Source

`src/components/content/Pic.vue`; `src/components/util/Img.vue`; the most-used container in the upstream corpus (126 occurrences).
