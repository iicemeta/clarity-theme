# VideoEmbed

**English** | [简体中文](./video-embed.zh-CN.md)

## Purpose

A responsive, lazy-loaded video embed for raw files and several platforms, with per-type aspect ratios.

## Basic Syntax

```md
::video-embed
---
type: bilibili
id: BV1Yr421p7rW
---
::

:video-embed{type="raw" id="https://example.com/clip.mp4" poster="https://example.com/poster.jpg"}
```

## Props

| Prop | Type / default | Notes |
| --- | --- | --- |
| `type` | `raw` \| `bilibili` \| `bilibili-nano` \| `youtube` \| `douyin` \| `douyin-wide` \| `tiktok`, default `raw` | Embed flavor |
| `id` | string, required | Platform video id; for `raw`, the video URL |
| `autoplay` | boolean | Passed to player URLs |
| `ratio` | string \| number | e.g. `"16 / 9"`, `1.6`; defaults per type (douyin `27 / 56`, douyin-wide `1198 / 731`, others `16 / 9`) |
| `poster` | string | Poster image, `raw` only |
| `width` / `height` | string | Max dimensions (`height` default `80vh`) |

Quote long numeric ids in YAML so they stay strings.

A `zoom` prop is declared in the component source but currently unused — the Douyin types compute their zoom internally. Do not pass it.

## Slots

None.

## Supported Values

See `type`. External iframes load lazily; autoplay depends on the platform.

## Examples

```md
::video-embed{type="youtube" id="dQw4w9WgXcQ"}
::
```

## Nesting

Standalone block.

## When to Use

A video that is the content — demos, talks, replays the article discusses.

## When Not to Use

Decorative clips, or many embeds per article (they are heavy and third-party).

## Common Mistakes

- Unquoted 19-digit Douyin ids parsed as numbers.
- Setting `poster` on an iframe type.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3).

## Source

`src/components/content/VideoEmbed.vue`; 10 occurrences in the upstream corpus.
