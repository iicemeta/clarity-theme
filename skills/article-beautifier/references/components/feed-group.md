# FeedGroup


## Purpose

A titled group of FeedCards with an optional shuffle button — the friend-links page's data container.

## Basic Syntax

```md
::feed-group{name="Friends" desc="People I read" shuffle}
… FeedCard-compatible entries are normally provided as data, not hand-written …
::
```

In practice the group receives an `entries` array; writing `entries` by hand in YAML is possible but verbose — that is the friend-links page's job.

## Props

`FeedGroup` fields (source: `src/config/feed.ts`) plus one flag: `name`*, `desc`, `entries`* (`FeedEntry[]`), `shuffle` (boolean — enables the shuffle/unshuffle control).

## Slots

None.

## Supported Values

`shuffle` respects the URL query `?shuffle=false` to restore the original order (source: `FeedGroup.vue`).

## Examples

The upstream friend-links page maps consumer `feeds.ts` groups to this component and passes `shuffle` from the `link.randomInGroup` app-config key.

## Nesting

Contains FeedCard data; do not nest other content.

## When to Use

Only a real friend-links listing backed by consumer data.

## When Not to Use

Any article structure. Grouping article content belongs to headings, CardList, or Tab.

## Common Mistakes

- Hand-writing `entries` in an article instead of maintaining `feeds.ts`.
- Expecting shuffle behavior without the `shuffle` flag.

## Support Status

`conditional` — shipped, but meaningful only with consumer feed data and the friend-links page. Excluded from the Skill's recommendations.

## Source

`src/components/content/FeedGroup.vue`; type `src/config/feed.ts`; upstream `app/pages/link.vue`.
