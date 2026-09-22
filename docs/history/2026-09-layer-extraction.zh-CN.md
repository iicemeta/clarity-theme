# 历史：Layer 抽取与早期验证

[English](./2026-09-layer-extraction.md) | **简体中文**

> 历史记录——不再对当前状态具有权威性。当前事实见 [PROJECT-STATUS](../PROJECT-STATUS.zh-CN.md)。

## 背景

Clarity Theme 最初是对上游 `blog-v3` Nuxt 站点通用部分的抽取。早期规划文档把这项工作称为 `devdoc`、`devdoc2.0`，以及编号的 Phase 0–6 / A–F 阶段。这些标签描述的是迁移工作包与一次性审计；它们不是当前的状态体系。

## 历史顺序

- **基线冻结：** 上游 3.7.2，commit `f6ea97d7`。
- **纯化：** 移除文章、作者/站点配置、友链数据、重定向、部署设置与上游私有资源。
- **配置 API：** 引入 `clarity.config.ts`、Zod schema、TS/MJS 运行时轨与 `modules/clarity-config`。
- **Layer 本地化：** 将 CSS、图标、组件、模块、remark 插件、服务端导入与包路径转换为 Layer 安全的解析方式。
- **Playground 与生成：** 添加 workspace playground 与静态生成验证。
- **渲染兼容性：** 添加 Markdown/MDC/代码/数学/Mermaid/乐谱/图片基准页面，以及后来的自动化 SSR/浏览器/水合检查。
- **真实消费者：** 添加 tarball 打包、独立安装、导出/类型检查与配置分支生成。
- **配置加固：** 严格 schema、友好错误、公共配置收窄、类型增强、依赖声明与反镜像纯化。
- **补丁审计：** 把所需的包补丁移到站点消费者，并移除旧的行内代码 MDC hunk。
- **CI：** 添加分层的 lint/typecheck/verify/sync/contract/peers、generate、consumer 与 compatibility 作业。
- **上游同步：** 添加四分类 manifest、check/diff/apply/verify 模式、事务式 apply、回归测试与每周漂移 Issue。

## 历史差分站点

一个仓库外的差分消费者通过本地 tarball 把上游博客的完整数据叠放在主题之上。一次性结果记录：

- 242 条预渲染路由，零报告错误
- Atom 限制为 50 条
- 统计输出 90 行 Content / 132,995 字
- OPML 含 137 个订阅
- 完整的消费者重定向配置
- 已打补丁的 MDC 环境与消费者 UI 覆盖

那次运行是一个有用的迁移里程碑，但没有纳入版本控制或 CI。到 2026-09-22，它仍引用较旧的本地 `clarity-theme-0.1.0-4.tgz`；其持久化输出早于当前 HEAD。它不得被用作当前的发布门槛。

## 处置

曾经占据 README 的阶段 TODO 清单已完成，并已从用户入口移除。详细的一次性审计保留在该目录之外的历史文件中，并标记为非权威。
