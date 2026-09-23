# 创建新的 Clarity 博客

[English](./new-project.md) | **简体中文**

最快的启动方式是官方创建包。它与主题分开，以 `create-clarity-theme` 独立发布，会生成一个独立的 Nuxt 项目——而不是本仓库的 fork。

## 环境要求

- 满足主题 engine 范围的 Node.js（`^22.19 || ^24.11 || >=26`）
- pnpm、npm 或其他兼容的包管理器

## pnpm

```bash
pnpm create clarity-theme@beta my-blog
```

## npm

```bash
npx create-clarity-theme@beta my-blog
```

当前初始预发布位于 `@beta` dist-tag；稳定版创建器提升为 `latest` 后即可使用不带标签的命令。

CLI 会询问站点元数据与偏好的包管理器。每个提示都会显示可编辑的默认值，
直接按 Enter 即可接受：

| 提示 | 默认值 |
| --- | --- |
| 项目名 | `my-blog` |
| 站点标题 | 由项目名转换（`my-blog` → `My Blog`） |
| 站点描述 | `My personal blog built with Clarity Theme` |
| 站点 URL | `https://example.com/` |
| 作者名 | `Your Name` |
| 语言 | `zh-CN` |
| 时区 | 自动检测系统时区，检测失败时回退 `UTC` |
| 建站日期 | 按所选时区计算的创建当天日期 |

时区优先级为：`--timezone` 参数 > 检测到的系统时区 > `UTC`。随后 CLI 会生成：

- 一个 `extends: ['clarity-theme']` 的 Nuxt 消费项目
- 接入 Clarity 公共导出的 `clarity.config.ts` 与 `content.config.ts`
- `content/posts/` 下的一篇通用欢迎文章
- 最小化的、经过测试的直接依赖

## 下一步

```bash
cd my-blog
pnpm dev
```

接着：

1. 在 `clarity.config.ts` 中填写站点信息——见[配置](../guides/configuration.zh-CN.md)。
2. 运行 `pnpm new-blog "我的第一篇文章"` 创建第一篇文章，再替换或删除欢迎文章——见[内容](../guides/content.zh-CN.md)。
3. 可选：添加根目录 `feeds.ts` 友链数据——见[手动安装](./manual-installation.zh-CN.md)。
4. 自定义 UI 默认值、组件与样式——见[自定义](../guides/customization.zh-CN.md)。

完整 CLI 参数（包括 `--yes`、`--help` 与 `--no-install`）见 [`create-clarity-theme/README.md`](../../create-clarity-theme/README.md)。

## 部署

生成的项目是标准 Nuxt 应用：运行 `pnpm generate` 得到静态输出，或 `pnpm build` 得到 SSR。部署配置、重定向、环境变量与平台设置都保留在你的项目中——主题永远不携带它们。密钥只能放在服务端的 `runtimeConfig`。
