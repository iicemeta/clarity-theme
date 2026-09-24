# Timeline


## Purpose

A vertical timeline. Caption lines in braces become the timeline nodes; the blocks after them become the events.

## Basic Syntax

```md
::timeline
{2026-01}

Project started.

{2026-06}

First release.
::
```

## Props

None.

## Slots

- `default` — blocks whose whole text matches `{…}` become `dt` captions; every other block becomes a `dd` event body

## Supported Values

Any caption text inside braces — dates, phase names, versions.

## Examples

```md
::timeline
{Phase 1}

Discovery and inventory.

{Phase 2}

Layer extraction.
::
```

## Nesting

Event bodies accept Markdown and inline components; keep nesting shallow.

## When to Use

Chronologies, release histories, migration phases — events tied to labeled points.

## When Not to Use

Ordered instructions (use a list) or unlabeled groups (use headings).

## Common Mistakes

- Writing the caption on the same line as the event.
- Expecting captions to be dates only — any brace text works.

## Support Status

`supported` — source-verified; not yet covered by a compatibility fixture (see audit gap 3). Like Chat, it reads slot VNode text non-standardly; keep the caption-block convention.

## Source

`src/components/content/Timeline.vue`; 8 occurrences in the upstream corpus.
