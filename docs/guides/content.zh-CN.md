# 内容

[English](./content.md) | **简体中文**

Clarity 渲染一个名为 `content` 的 Nuxt Content 集合，由 `createClarityContentConfig()` 根据你的站点配置生成。事实来源：`src/config/content.ts` / `src/config/content.mjs`、`src/modules/clarity-config/index.ts` 中的 `content:file:afterParse` hook，以及 `nuxt.config.ts` 中的渲染管线。

## 集合布局

```text
content/
├─ posts/       # 文章（首页列表、归档与 Atom 订阅查询这里）
├─ previews/    # 未发布文章，列在 /preview，不进入首页列表
└─ …            # 其他 Content 页面，由 catch-all 路由提供
```

`content.config.ts` 必须用与 `clarity.config.ts` 相同的根配置调用工厂：

```ts
import { createClarityContentConfig } from 'clarity-theme/content'
import clarityConfig from './clarity.config'

export default createClarityContentConfig(clarityConfig)
```

工厂会再次解析配置（Zod 严格模式）、生成文章 schema，并用 `updated || published || date` 派生的 sitemap `lastmod` 元数据扩展它。

## 创建文章

由 `create-clarity-theme` 生成的项目自带消费方自己的写作脚本：

```bash
pnpm new-blog
pnpm new-blog "我的新文章"
pnpm new-blog "我的新文章" --yes
```

它会在 `content/posts/<year>/<slug>.md` 创建文章，并生成符合 schema 的
`title`、`date`、`updated`、`draft`、`categories`、`tags`、`type`
frontmatter。时间戳使用检测到的系统时区（失败时回退 `UTC`）；已存在的文件名
不会被覆盖，而是追加数字后缀。

这个脚本属于生成的消费项目，不属于 Theme Layer。手动安装的消费方可以直接
创建 Markdown 文件，也可以从创建器模板复制 `scripts/new-blog.mjs` 到自己的
仓库。

## 文章 frontmatter

| 字段 | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `title` | string，可选 | 页面标题与 SEO 标题 |
| `description` | string，可选 | 摘要与 SEO 描述 |
| `date` | string，可选 | 创建日期；驱动年度归档与 Atom `published` 回退 |
| `updated` | string，可选 | 更新日期；用于排序与 Atom `updated` |
| `published` | string，可选 | Atom/sitemap 的显式发布日期；回退到 `date` |
| `categories` | string[]，默认 `[article.defaultCategory]` | 首个分类驱动列表筛选 |
| `tags` | string[]，默认 `[]` | 自由标签，展示在统计与文章页脚 |
| `type` | `article.types` 键的枚举，默认第一个键 | 文章版式；`types` 为空时 schema 回退 `tech` |
| `image` | string，可选 | 封面/og 图片 |
| `recommend` | number，可选 | 非 null 时进入推荐列表，按 `recommend` 再按 `date` 排序 |
| `references` | `{ title?, link? }[]`，可选 | 参考资料列表 |
| `draft` | boolean，默认 `false` | Content 元数据；Theme 自身的未发布机制是 `previews/` 路径约定 |
| `permalink` | string，可选 | 自定义路由；原样生效 |
| `readingTime` | 注入 | 由 `remark-reading-time` 填充；不要手动设置 |

## 路由

- `content/posts/` 下的文章默认从 `/…` 提供：当 `article.hidePostPrefix` 为 `true`（默认值）时，模块的 `content:file:afterParse` hook 会去掉 `/posts` 前缀。
- frontmatter `permalink` 总是优先，并在前缀隐藏之前应用；升级时不要重新生成固定链接。
- `/preview` 列出 `previews/%` 下的全部内容。配置 `article.robotsNotIndex`（例如 `['/preview', '/previews/*']`）可以把预览页排除在 `robots.txt` 之外；默认为空数组。
- 其他 Content 页面由 catch-all 页面渲染；不存在的路径返回 404。

## 渲染功能

Layer 配置了完整的 Markdown 管线；消费方不应重复注册插件：

- **Markdown/MDC** —— MDC 组件语法（`:badge{name="Nuxt"}`）、prose 组件、slot 与 `remark-code-component`。
- **代码** —— Shiki 高亮由 Theme 的 prose 组件在运行时执行（Content 构建期高亮已关闭）；`mermaid` 与 `music-abc` 围栏块会转换为组件 props。
- **数学** —— `remark-math` + `rehype-katex`，搭配远程 KaTeX 样式表。
- **乐谱** —— `MusicScore` content 组件渲染 ABC 记谱。
- **图片** —— 富图片组件与 Nuxt Image 处理；小数 density 或 ICO 透传可能需要消费方补丁（见[补丁策略](../maintainers/patches.zh-CN.md)）。
- **阅读时间 / TOC / meta slot** —— 由 remark 插件与 rehype-meta-slots 注入。

已验证的功能矩阵生成于[兼容性说明](../reference/compatibility.zh-CN.md)。面向作者的语法、逐组件 references 与能力审计见[Markdown / MDC 参考](../_content/mdc/README.zh-CN.md)（属内容创作语料而非主题文档）。自定义渲染输出时，优先使用[自定义](./customization.zh-CN.md)中描述的组件与 Shiki 覆盖。
