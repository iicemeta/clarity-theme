# create-clarity-theme

Create an independent Nuxt 4 blog that consumes the published
[Clarity Theme](https://www.npmjs.com/package/clarity-theme) Layer.

The current initial prerelease is `0.1.0-beta.3` and is distributed through
the npm `beta` dist-tag:

```bash
npx create-clarity-theme@beta my-blog
```

## Create a new blog

### pnpm

```bash
pnpm create clarity-theme my-blog
```

### npm

```bash
npx create-clarity-theme@beta my-blog
```

Then:

```bash
cd my-blog
pnpm dev
```

The CLI asks only for the project name, site identity, URL, author, language,
and timezone. Clarity Theme provides documented defaults for every other
setting.

## Options

| Option | Description |
| --- | --- |
| `--title <title>` | Site title |
| `--description <text>` | Site description |
| `--url <url>` | Canonical HTTP(S) site URL |
| `--author <name>` | Author name |
| `--language <tag>` | BCP 47-style language tag |
| `--timezone <zone>` | IANA timezone |
| `--package-manager <name>` | Use `pnpm`, `npm`, or `yarn` |
| `--no-install` | Generate files without installing dependencies |
| `--yes`, `-y` | Use defaults for remaining prompts |
| `--version`, `-v` | Print the CLI version |
| `--help`, `-h` | Show all options |

The installer is inferred from `npm_config_user_agent`, so `pnpm create` uses
`pnpm install` and `npx` uses `npm install`. Windows paths are supported and
installation commands never interpolate project metadata into a shell command.

## Generated project

```text
my-blog/
├─ app/app.config.ts
├─ content/posts/welcome.md
├─ public/favicon.svg
├─ clarity.config.ts
├─ content.config.ts
├─ feeds.ts
├─ nuxt.config.ts
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.json
└─ .gitignore
```

The generated project depends directly on `clarity-theme`, Nuxt, Vue,
vue-router, TypeScript, vue-tsc, Nuxt Content, and Zod. Other Clarity runtime
dependencies remain Theme dependencies. The template contains no upstream
articles, friend links, analytics IDs, deployment settings, domains, or tokens.

## Verification

From the repository root:

```bash
pnpm test:create
pnpm test:create:e2e
pnpm test:create:tarball
```

These commands respectively test CLI behavior, a generated independent
consumer through install/typecheck/generate, and the packed npm tarball through
its installed `create-clarity-theme` binary.
