# ABC Music


## Purpose

Render ABC notation as sheet music, with optional playback controls.

## Basic Syntax

````md
```music-abc
X:1
T:Clarity Test
M:4/4
L:1/8
K:C
CDEF GABc | c'BAG FEDC |
```
````

## Behavior

- Rendered by `MusicScore.vue` (abcjs) via the [code-component mapping](./code-component.md); never write `:music-score`.
- Notation renders without any network access to sound fonts.
- Playback appears only when the browser supports audio and `https://paulrosen.github.io/midi-js-soundfonts/` is reachable (probed with a HEAD request); failures are logged and degrade silently to notation-only.
- The score is responsive (`resize` mode).

## When to Use

Actual musical examples the article discusses.

## When Not to Use

ASCII-art tabs or non-ABC notation, or decoration — sheet music is dense.

## Common Mistakes

- Expecting playback on offline/self-hosted deployments — notation still renders.
- Invalid ABC headers; abcjs errors surface as a broken score, not a friendly message.

## Support Status

`supported` — verified by compatibility cases `D-music` and `D-music-client` (rendering); playback is network-conditional by design.

## Source

`src/components/content/MusicScore.vue`; mapping in `nuxt.config.ts`; upstream usage in the showcase.
