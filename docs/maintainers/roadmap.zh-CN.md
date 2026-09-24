# 路线图

[English](./roadmap.md) | **简体中文**

按顺序排列的开放工作。已完成的工作不在这里跟踪——它记录在 [CHANGELOG](../../CHANGELOG.md) 与[历史](../history)下的审计中。本页从属于源代码、包 manifest、测试、CI 与 `sync-manifest.json`；只要预期边界与行为不变，实现可以选择更好的文件或技术。

## 现在

1. **创建包首次发布** —— 完成为 `publish-create.yml` 配置 npm Trusted Publisher 的一次性设置，发布已审查的 `create-v<version>` GitHub Release，并用 `npm view create-clarity-theme` 与公共命令验证 registry 产物（见[发布 §创建包](./publishing.zh-CN.md#12-发布-create-clarity-theme)）。
2. **TypeScript / MJS parity 门禁** —— 公共运行时 `.mjs` 文件与 TS 源码目前靠人工配对。先增加确定性的 parity 检查（成对导出名、schema 默认值/严格性、代表性 helper 输出），再考虑代码生成。

## 下一步

1. **外部资产来源可配置** —— KaTeX/Inter 默认使用 `s4.zstatic.net`，JetBrains Mono/Noto Serif SC 默认使用 Google `.cn` 端点，都是固定的 Layer head 链接。增加一个有文档的 asset-origin 配置组，支持显式默认值、替换与禁用 Theme 提供的远程链接。
3. **减少 `plain-shiki` 消费方补丁** —— 先评估 Theme 侧公开 selector 选项，再推动上游依赖修复；不要 fork 依赖。
4. **`@nuxt/image` 小数 density** —— 推动上游 `parseInt → parseFloat` 解析修复，并在支持时补 Theme 回归用例。

## 以后

1. 增量交互、无障碍、响应式与服务失败测试（归档控件、代码折叠/复制、小部件组合、预览入口、抽屉/遮罩、Twikoo 远程初始化、ABC 音频、搜索键盘行为）。
2. 减少已接受的告警类别（`NUXT_B3011`、link-checker/资源噪声、Vue slot/readonly、og:image、`twitter:card`、远程 Shiki），同时不隐藏有用诊断。
3. 受限/离线 Shiki 构建支持（打包或显式本地引擎选项）。
4. 在有具体反垃圾/隐私需求时，再决定 `site.author.email` 可见性/输出选项。
5. 在不削弱现有保证的前提下，把纯度检查泛化到显式上游标识 allow/block 列表之外。
6. 仅当具体变更导致大型验证 harness 难以维护时才拆分；覆盖与失败清晰度不得下降。

## 推迟

1. **差分消费者重构** —— 仓库外的 `theme-based-blog-v3` 环境是历史手工证据，不是 CI 门禁；不要导入本仓库（会把上游文章/私有站点数据混入 Theme 包）。
2. **Node 26 CI 覆盖** —— 开放 engine 范围没有稳定矩阵代表；出现固定 `^26.x` 范围后再处理。
3. **大规模视觉回归 / 新平台工作** —— 交互覆盖成熟前不计划。

## 冻结契约

推进上述事项时不要重新设计：

- 五个包导出入口与"包导出 vs Layer 运行时契约"的区分。
- 消费方文件模型：`clarity.config.ts`、`content.config.ts`、可选 `feeds.ts`、可选仅 UI 的 `app/app.config.ts`。
- `clarity.config.ts` 输入形状与严格未知字段拒绝。
- Content 集合工厂与文章 schema 边界。
- 同路径组件覆盖行为（包括已接受的 `NUXT_B3011` 告警）。
- 消费方对站点内容、部署规则、密钥、重定向与包管理器补丁的所有权。
- 事务性上游同步语义：未知路径阻塞 apply；已改造的 include 路径冲突而不是覆盖。

## 现在不要做

- 不要实现随机固定链接生成器（属于消费方构建脚手架）。
- 不要把完整差分博客或其内容导入本仓库。
- 不要采用、fork 或再分发消费方依赖补丁。
- 不要在增加最小 parity 门禁前自动生成全部 `.mjs` 文件。
- 不要在边界工作未完成时重构完整 UI 或测试 harness。
- 不要让上游基线越过未审查的增量。
