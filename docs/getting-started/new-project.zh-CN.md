# 创建新的 Clarity 博客

[English](./new-project.md) | **简体中文**

最快的启动方式是官方创建包。它与主题分开，以 `create-clarity-theme` 独立发布，会生成一个独立的 Nuxt 项目——而不是本仓库的 fork。

## 环境要求

- 满足主题 engine 范围的 Node.js（`^22.19 || ^24.11 || >=26`）
- [pnpm](https://pnpm.io/installation/) —— 生成的项目自带 pnpm
  `patchedDependencies` 与 `packageManager` 声明，因此即使通过 `npx`
  启动创建器，依赖也始终用 pnpm 安装

## pnpm

```bash
pnpm create clarity-theme my-blog
```

## npm

```bash
npx create-clarity-theme@latest my-blog
```

上述命令从 npm `latest` dist-tag 解析稳定版创建器。如需刻意使用预发布创建器，
可显式固定 `@<version>` 或使用历史 `@beta` dist-tag。

创建器是新项目骨架、`package.json`、Nuxt 配置、Clarity 配置与最小已测试直接
依赖的 source of truth。不要手写 `package.json`、自行猜测 Nuxt/Vue/Nuxt
Content 版本或手工拼接 Nuxt 骨架 —— 如果 Agent 被要求创建 Clarity 博客，必须
运行官方创建器。迁移既有 `blog-v3` 站点是另一条工作流，见
[blog-v3 迁移指南](./migration-from-blog-v3.zh-CN.md)。

CLI 会询问站点元数据，以及是否立即用 pnpm 安装依赖。每个提示都会显示
可编辑的默认值，直接按 Enter 即可接受：

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

## 上游示例内容

Clarity 从 blog-v3 提取，Layer 中有意保留了上游作者的少量公开示例——与上游
作者自己的 `init-project` 初始化脚本保留的内容一致，可作为配置参考。创建完成
后 CLI 会输出 `Upstream example content` 提醒并逐项列出；简表如下：

| 内容 | 出现位置 | 修改方式 |
| --- | --- | --- |
| CommGroup 交流群 widget（QQ 群 `169994096`、群头像、`纸网接入点`） | 文章 frontmatter 设置 `aside: [comm-group]` 时 | 在项目中创建 `app/components/widget/CommGroup.vue` 覆盖 |
| BlogLog 更新日志 widget（上游站点历史，含 `zhilu.site` / `zhilu.cyou`） | 非文章页 / 404 页侧栏 | 创建 `app/components/widget/BlogLog.vue` 写入自己的历史 |

未使用的 `zi:zhilu` 图标资源、内部反镜像黑名单以及 Atom feed 中指向 blog-v3
的 `generator` 署名无需处理——它们不会作为站点内容渲染。

## 更新 Theme

生成的 `package.json` 声明的是 caret range（例如 `^0.2.0`）。按 npm
node-semver 规则，它表示 `>=0.2.0 <0.3.0`：可以接受后续 `0.2.x` patch 版本，
不能接受 `0.3.0`，且 caret range 并不是锁死版本。lockfile 记录的是实际解析
安装的 resolved version，在你主动更新之前可能一直停留在 range 内较旧的
patch 版本上 —— 仅运行 `pnpm install` 不会刷新它：

```bash
pnpm update clarity-theme          # 在已声明范围内刷新 resolved version
pnpm add clarity-theme@<version>   # 显式修改依赖声明本身
```

永远不要手工编辑 `pnpm-lock.yaml`。

## 部署

生成的项目是标准 Nuxt 应用：运行 `pnpm generate` 得到静态输出，或 `pnpm build` 得到 SSR。部署配置、重定向、环境变量与平台设置都保留在你的项目中——主题永远不携带它们。密钥只能放在服务端的 `runtimeConfig`。
