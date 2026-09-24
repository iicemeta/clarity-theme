# {{SITE_TITLE}}

{{SITE_DESCRIPTION}}

## Development

```bash
pnpm dev
```

## Production generation

```bash
pnpm generate
```

## Write a new article

```bash
pnpm new-blog
# or provide the title directly
pnpm new-blog "我的新文章"
```

The command creates `content/posts/<year>/<slug>.md` with Clarity-compatible
frontmatter. It never overwrites an existing file.

## Upstream example content

Clarity is extracted from blog-v3 and intentionally keeps a few public
examples from the upstream author in the Layer. Review and replace whatever
does not belong to your site:

| Content | Where it appears | How to change it |
| --- | --- | --- |
| CommGroup widget (QQ group `169994096`, group avatar, `纸网接入点`) | Articles whose frontmatter sets `aside: [comm-group]` | Create `app/components/widget/CommGroup.vue` in this project |
| BlogLog widget (upstream site history, incl. `zhilu.site` / `zhilu.cyou`) | Sidebar of non-article / 404 pages | Create `app/components/widget/BlogLog.vue` with your own history |

No action is needed for the unused `zi:zhilu` icon asset, the internal
anti-mirror blacklist, or the Atom feed `generator` URI that credits blog-v3 —
they are not rendered as your site content.

Update `clarity.config.ts`, write articles in `content/posts/`, and add public
assets in `public/`. See the
[Clarity Theme documentation](https://github.com/iicemeta/clarity-theme) for
configuration and customization.
