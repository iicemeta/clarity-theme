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

Update `clarity.config.ts`, write articles in `content/posts/`, and add public
assets in `public/`. See the
[Clarity Theme documentation](https://github.com/iicemeta/clarity-theme) for
configuration and customization.
