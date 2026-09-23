# 上游 patch 审计

[English](./2026-09-patch-audit.md) | **简体中文**

> **历史审计快照——不再具有权威性。**
> 当前细化后的补丁边界总结见[补丁说明](../maintainers/patches.zh-CN.md)。

审计日期：2026-09-21

审计对象：

- upstream：`blog-v3-upstream`
- Theme：`clarity-theme`
- 差异测试 consumer：`theme-based-blog-v3`

本文取代 `docs/PATCHES.md` 中较粗粒度的结论。这里的“Consumer 依赖”指迁移
blog-v3 内容与配置的真实站点；不表示所有未来 Theme 使用者都需要同一组 patch。

## 结论总表

| Patch | 当前目的 | Theme 是否依赖 | Consumer 是否依赖 | 建议方案 | 理由 | 实施成本 | 长期维护成本 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `@nuxtjs__mdc.patch` | ① fenced code 不执行 `detab`，保留 tab；② inline code 增加 `properties.code` | ① 是：代码块原文、复制、字节数、`tab-size` 都以 `props.code` 为准；② 否：`ProseCode.vue` 已从插槽递归取原文 | blog-v3 内容依赖 ①；② 不依赖。无 tab 内容的普通 consumer 可以不打 | 保留 **detab-only consumer patch**；不迁移 inline code hunk；向 MDC 推进可配置 `detab` | tab 是 Theme 公开的代码块行为，上游默认把 tab 转为 4 空格会破坏原文保真；inline code 已有 Theme 侧兼容实现 | 低：consumer 已有精简 patch，只需保留并随锁文件更新 | 中：patch 目标是发行版 dist，依赖升级时可能需要重做；需跟踪上游 issue |
| `@nuxt__image.patch` | `parseDensities()` 用 `parseFloat` 取代 `parseInt`，支持 `1.5x` 这类小数密度 | 条件依赖：全局 `densities: [1, 1.5, 2]` 是数字，不打 patch 也有效；但 content / 组件传入 `densities="1.5x"` 时需要 | 是：当前 blog-v3 内容有 67 个 `densities` prop，其中 58 个是小数密度；不打 patch 时 `1.5x` 被截断成 `1x` | 保留为 consumer 必需 patch；向 `@nuxt/image` 提交小修复 PR 和 fractional density 测试 | 这是上游解析函数的明确缺陷；Theme 的 `Pic` / `UtilImg` 公开透传 `densities`，无法在配置层修复所有调用点 | 低：现有 patch 只改一行；上游修复也应很小 | 低到中：在 `@nuxt/image` 合并修复前，每次升级需要确认 patch 仍适用 |
| `ipx.patch` | 遇到 ICO 且未要求转出其他格式时直接返回原始数据，绕过 Sharp | 否：Theme 没有必须经 IPX 处理 ICO 的路径；`/favicon.ico` 被重定向到配置的 favicon，外部 ICO 当前也不会进入 IPX | 当前真实 consumer 不依赖；只在把 ICO 域名加入 `image.domains` 或本地 ICO 经 IPX 处理时需要 | 从 Theme / 默认 consumer 要求中移除；作为可选站点级 recipe；向 IPX 提 issue / PR，但避免静默忽略 resize | Sharp / libvips 不能解码 ICO；但当前生成物中没有 `_ipx/...ico`，外部 ICO 保持直链。现有 patch 在有 resize 请求但无显式转码格式时也可能静默忽略变换 | 中：删除后需要 consumer 重新 install / generate 并检查 ICO 路径 | 若作为可选 patch：中；若默认移除：低 |
| `plain-shiki.patch` | 给 `:root::highlight(...)` 和 `.theme::highlight(...)` 补上后代组合器空格 | 当前是：`Copy.vue` 使用 `mountPlain()`，无 patch 时自定义高亮颜色不能命中后代文本的 HighlightRange | 当前需要；但在 Theme 侧传公开的 `defaultSelector` / `selector` 后即可不需要 | 立即保留 consumer patch；后续修改 Theme `useShiki.ts` 传带尾部空格的 selector，然后删除 patch；同时向 plain-shiki 提默认 selector 修复 PR | CSS Custom Highlight API 的 range 位于后代文本节点上，`:root::highlight()` 选择的是 root 自身的 highlight，通常匹配不到这些 range；plain-shiki 已公开 selector 覆盖点 | 低：一处 Theme 代码可解除；本任务该文件不在允许修改范围内 | 修复后接近零；保留 patch 则每次升级需要检查 dist 变化 |

## 架构结论

1. **Theme npm 包继续不携带 patch。**
   - pnpm 的 `patchedDependencies` 是安装工作区的机制，不会随 npm package 传递。
   - `clarity-theme` 的 `files` 列表也不包含 `patches/`。
   - 即使把 patch 文件放进包里，consumer 仍必须复制文件并在自己的 package-manager 配置和锁文件中注册。
2. **patch 属于站点级兼容决策。**
   - 迁移 blog-v3 内容的 consumer 当前至少需要：
     - `@nuxtjs/mdc` detab-only patch；
     - `@nuxt/image` `parseFloat` patch。
   - `plain-shiki` patch 是短期兜底；Theme 侧修复后应删除。
   - `ipx` patch 不应列为默认必需项。
3. **不建议 fork 任何一个依赖。**
   - 四个问题都可以用小 patch、公开配置点或上游小 PR 解决。
   - fork 会引入完整依赖发布、同步和安全更新成本，明显超过收益。

本轮最终实施：**不修改 `patches/**`、`package.json`、`pnpm-workspace.yaml`、`nuxt.config.ts`。**
Theme 当前“无 patch”的状态就是正确架构；把 upstream patch 原样复制进来反而会让
playground 与真实 npm consumer 的安装环境不一致。

## 逐项审计

### 1. `patches/@nuxtjs__mdc.patch`

#### 修改的第三方行为

upstream patch 有两个独立效果：

1. fenced code handler：

   ```diff
   - const value = node.value ? detab(node.value + "\n") : "";
   + const value = node.value ? node.value + "\n" : "";
   ```

   `@nuxtjs/mdc` 默认调用 `detab`，把源码中的 tab 按列 expand 成空格。

2. inline code handler：

   ```diff
   - properties: node.attributes || {},
   + properties: { ...node.attributes, code: text.value },
   ```

   让 inline code 元素直接携带 `code` prop。

#### 为什么 blog-v3 需要它

- 原站内容中有 4 个 Markdown 文件、198 行包含 tab。默认 `detab` 会改变 fenced code 原文。
- inline code hunk 是旧实现为了让组件拿到原文而加的便利属性。

#### Theme 是否真的依赖

- **fenced code：依赖。**
  - `ProsePre.vue` 使用 `props.code` 生成 Shiki HTML、复制内容、行数、字符数和字节数。
  - CSS 使用 `--tab-size`，Theme 配置暴露 `component.codeblock.tabSize`。
  - 一旦 MDC 先把 tab 转成空格，Theme 无法区分“作者原本写的是 tab”还是“原本就是空格”。
- **inline code：不依赖。**
  - `ProseCode.vue` 在 `props.code` 不存在时会递归读取默认插槽的 text VNode。
  - 它已经同时兼容有 patch 和无 patch 的 MDC。

#### Consumer 是否必须拥有

- 迁移 blog-v3 内容的真实 consumer：**必须拥有 detab-only hunk**。
- 完全没有 tab 的 consumer：不是硬性运行时需求，可以不打；但会失去对 tab 源码的保真承诺。
- inline code hunk：**不需要**。

当前 `theme-based-blog-v3/patches/@nuxtjs__mdc.patch` 已经是 detab-only 版本，方向正确。

#### upstream 是否已修复

未修复。

- 当前锁定 / 最新 npm：`@nuxtjs/mdc@0.23.1`，仍使用 `detab`。
- 2026-08-10 检查的 main 分支（`b608ef3`）仍使用 `detab`。
- 已有开放 issue：
  [Remove use of detab or make tabSize configurable #445](https://github.com/nuxt-content/mdc/issues/445)

#### 是否可用 Theme 自身代码绕开

理论上可以，但不建议：

- 替换或包一层 Markdown parser / MDC handler，复杂且容易偏离 Nuxt Content 的默认行为。
- 在渲染后把前导 4 空格猜回 tab 不是无损还原，无法处理字符串中间的 tab。

#### 是否应该 fork

不应该。当前实际需要的 patch 只有一个 hunk；fork 整个 MDC 的维护成本显著更高。
只有在 upstream 明确拒绝可配置方案、且 tab 保真成为 Theme 核心卖点到无法接受 patch 时，
才值得重新评估。

#### 是否提交 upstream issue / PR

应该：

- 支持或跟进 #445。
- 更合适的 PR 不是直接删除 `detab`，而是提供配置项（例如 tab size 或 preserve source），
  因为直接改变默认值可能影响既有 MDC 输出和 CommonMark 处理预期。

#### 是否要求 Consumer 自己 patch

是。站点级 pnpm patch 是当前最小、最清晰的方式。

#### 是否可以彻底删除

- inline code hunk：**可以，且 consumer 已删除**。
- detab hunk：在 upstream 提供并发布可配置 / 保真方案前，不应删除。

---

### 2. `patches/@nuxt__image.patch`

#### 修改的第三方行为

`@nuxt/image` 的字符串密度解析：

```diff
- const d = Number.parseInt(density.replace("x", ""));
+ const d = Number.parseFloat(density.replace("x", ""));
```

#### 为什么 blog-v3 需要它

`NuxtImg` 的组件 prop 是字符串，例如 Markdown 中的：

```md
densities: 1.5x
```

未打 patch 时：

```text
Number.parseInt("1.5") // 1
```

因此 `1x 1.5x` 会折叠成重复的 `1x`，浏览器拿不到 1.5 倍资源。

#### Theme 是否真的依赖

分两层：

- Theme 在 `nuxt.config.ts` 设置：

  ```text
  image: { densities: [1, 1.5, 2] }
  ```

  这是数字数组，进入 `NuxtImg` 前已是 runtime config 数组，不经过出问题的字符串
  `parseDensities()` 路径。因此 **Theme 自身的全局默认输出不依赖 patch**。

- Theme 的 `Pic` / `UtilImg` 公开并透传字符串 `densities` prop；当内容作者写
  `1.5x` 时，Theme 的功能契约依赖正确解析。因此这是**条件依赖**。

#### Consumer 是否必须拥有

对当前 blog-v3 内容：**必须**。

审计统计：

- `densities` prop：67 处；
- 小数密度：58 处；
- 分布在 5 篇内容中。

不打 patch 时页面不会崩溃，但 srcset 静默降级，属于难以发现的性能 / 清晰度回归。

#### upstream 是否已修复

未修复。

- 当前锁定 / 最新 npm：`@nuxt/image@2.1.0`，仍是 `parseInt`。
- 2026-09-21 检查的 main 分支（`2aa7ca6`）仍是 `parseInt`。
- 未找到对应 fractional densities 的开放 issue / PR。

#### 是否可用 Theme 自身代码绕开

只能在部分入口绕开，不能完整替代：

- 在 `UtilImg.vue` 里识别小数字符串并改为省略 prop，让全局数字密度生效，会改变作者
  请求的精确密度集合。
- `NuxtImg` 的公开 prop 类型是 string，无法直接传 `number[]`。
- 直接修改其他 Theme 组件只覆盖显式使用 wrapper 的图片，覆盖不了所有 `NuxtImg` 调用。

`UtilImg.vue` 不在本轮允许修改范围内，而且该方案比上游一行修复更含糊。

#### 是否应该 fork

不应该。这是明确的一行解析缺陷，适合上游 PR。

#### 是否提交 upstream issue / PR

应该提交 PR：

1. `parseInt` 改为 `parseFloat`；
2. 增加覆盖 `1.5x`、多个空格分隔密度、非法输入的单元测试；
3. 说明浏览器 DPR 本身就是小数，当前文档和 API 已允许密度描述符。

#### 是否要求 Consumer 自己 patch

在上游修复发布前，迁移 blog-v3 内容的 consumer 需要 patch。

#### 是否可以彻底删除

上游修复进入 Theme 最低支持版本并完成 generate 回归后，可以删除。

---

### 3. `patches/ipx.patch`

#### 修改的第三方行为

IPX 在进入 Sharp 前增加：

```text
if (imageMeta.type === "ico" && (!mFormat || mFormat === "ico")) {
  return { data: sourceData, format: "x-icon", meta: imageMeta }
}
```

#### 为什么 blog-v3 需要它

Sharp / libvips 不能解码 ICO。让 ICO 进入 IPX 的 Sharp 管线时会报：

```text
Input file contains unsupported image format
```

upstream workspace 注释还引用了
[nuxt/image#2174](https://github.com/nuxt/image/issues/2174)，
说明作者尝试过换 runtime provider，但存在类型 / 配置问题，于是选择 patch IPX。

#### Theme 是否真的依赖

不固有依赖：

- Theme 的 `/favicon.ico` route rule 是重定向到 `site.favicon`，不会把 `/favicon.ico`
  交给 IPX 解码。
- blog-v3 的友链 / feed ICO 是外部 URL。当前 Theme 的 `image.domains` 为空；
  `@nuxt/image` 对未加入 allowlist 的远程 host 不走本地 IPX，而是输出原 URL。
- 已生成的 consumer 输出中，包含 `.ico` 的文件里有 92 个文件出现外部 ICO 直链，
  `_ipx/...ico` 为 0。

#### Consumer 是否必须拥有

当前真实 consumer：**不必须**。

以下场景才需要：

- 把 ICO 外部域加入 `image.domains`，导致远程 ICO 进入 IPX；
- 本地 `.ico` 资产通过 `NuxtImg` / IPX 处理；
- 站点部署环境强制把相关图片改走 IPX。

#### upstream 是否已修复

未修复。

- 当前锁定 / 最新 npm：`ipx@4.0.0-beta.1`。
- 2026-07-28 检查的 main 分支（`de8b0ab`）仍没有 ICO 处理分支。
- 未在 unjs/ipx 找到现成 ICO issue。

#### 是否可用 Theme 自身代码绕开

多数情况下可以不用绕开，只需避免让 ICO 进入 IPX：

- favicon 用现有 redirect；
- 外部 ICO 不加入 `image.domains`；
- 或把 ICO 资产换成 PNG / SVG。

如果确实需要对 ICO 做 resize / format 转换，Sharp 本身仍不能解码，需要在依赖层处理。

#### 是否应该 fork

不应该。这既不是 Theme 必需能力，也不是所有 IPX 用户都接受的行为。

#### 是否提交 upstream issue / PR

应该先提 issue / discussion，再设计 PR。直接合并当前 patch 有语义问题：

- 即使 URL 带 resize modifier，只要没有显式输出格式，它也返回原始 ICO，
  会静默忽略请求的变换。
- 更合理的方向是：
  1. 请求为 identity transform 时允许原样返回 ICO；
  2. 或对无法解码且要求变换的 ICO 返回明确的 unsupported format 错误；
  3. 若要支持 ICO，需要解码 / 重编码方案，而不是只绕过 Sharp。

#### 是否要求 Consumer 自己 patch

不应该作为默认要求。文档可以提供“如果你的 ICO 会进入 IPX，可自行选择站点级 patch”
的可选说明。

#### 是否可以彻底删除

- 对当前 `theme-based-blog-v3`：很可能可以删除，但需要修改 consumer 的
  `pnpm-workspace.yaml` 和 lockfile，并重新 `pnpm install` / `nuxt generate` 验证；
  这些文件不在本轮允许修改范围内。
- 对未来允许 ICO 进入 IPX 的 consumer：不能没有替代方案。

---

### 4. `patches/plain-shiki.patch`

#### 修改的第三方行为

plain-shiki 生成 adopted stylesheet 规则时补上后代组合器：

```diff
- const rule = `${selector}::highlight(${name}) { color: ${color}; }`;
+ const rule = `${selector} ::highlight(${name}) { color: ${color}; }`;
```

即从：

```css
:root::highlight(name)
.light::highlight(name)
```

改为：

```css
:root ::highlight(name)
.light ::highlight(name)
```

#### 为什么 blog-v3 需要它

CSS Custom Highlight API 的 `Highlight` range 注册在 `CSS.highlights`，但 range 的
实际文本节点通常是目标元素内部的子节点。没有后代组合器时，选择器尝试匹配
`:root` 或 `.light` 元素自身的 highlight，而不是其内部文本 range，颜色规则无法命中。

#### Theme 是否真的依赖

当前依赖：

- Theme 的 `Copy.vue` 通过 `useShiki().mountPlain(...)` 使用 plain-shiki。
- 无 patch 时复制框代码的 plain-shiki 颜色高亮失效。

不过 plain-shiki 已公开 mount options：

```text
defaultSelector?: string
selector?: (theme: string) => string
```

因此这不是只能靠 patch 解决的依赖。

#### Consumer 是否必须拥有

当前 consumer 需要 patch 才能保持高亮行为。

一旦 Theme 侧传入：

```text
createPlainShiki(shiki).mount(target, {
  ...options,
  defaultSelector: ':root ',
  selector: theme => `.${theme} `,
})
```

即可使用库的公开配置覆盖默认错误 selector，consumer patch 可删除。

该修改位置是 `app/composables/useShiki.ts`，不在本轮允许修改范围内，因此本轮不实施。

#### upstream 是否已修复

未修复。

- 当前锁定 / 最新 npm：`plain-shiki@0.3.2`。
- 2025-11-02 检查的 main 分支（`445759f`）仍生成无空格 selector。
- 未找到现成 issue。

#### 是否可用 Theme 自身代码绕开

可以，且是最佳方案：通过公开 `defaultSelector` / `selector` option 传入带尾部空格的
选择器。相比 patch dist，该方式更稳定，也不要求 consumer 管理 patch。

#### 是否应该 fork

不应该。一个上游默认值修复加一个 Theme 配置覆盖即可解决。

#### 是否提交 upstream issue / PR

应该。PR 应包含：

1. 默认 selector 改为 `':root '` / `` `.${theme} ` ``；
2. 一个能验证后代 HighlightRange 命中的测试或最小示例；
3. 说明 CSS Custom Highlight range 归属于文本节点，而非 root / theme 元素自身。

#### 是否要求 Consumer 自己 patch

短期：是，直到 Theme 完成 selector 覆盖。

中期：否。Theme 代码修复后应从 consumer 删除。

#### 是否可以彻底删除

可以，分两步：

1. 修改 `useShiki.ts` 的 `mountPlain()` options；
2. 回归验证 `Copy.vue` 的 light / dark 高亮后，删除 consumer patch 并更新 lockfile。

---

## 额外发现的未注册 patch

upstream 和差异测试 consumer 都有：

```text
patches/@vue__shared.patch
```

但两边的 `pnpm-workspace.yaml` 都没有注册它，因此它当前不生效。

该 patch 只把 `IsKeyValues` 的 TypeScript helper 从 `string` 泛型改为 `PropertyKey`。
当前 Theme 在 `@vue/shared@3.5.43` 下 typecheck 通过，未发现 Theme 或真实 consumer
依赖该类型改动。

建议：

- upstream 直接删除该文件；
- Theme 不迁移；
- 不注册、不 fork、不提 PR。

## 分阶段实施清单

### 本轮已完成

1. 建立本审计报告。
2. 确认 Theme 保持无 patch 状态。
3. 不修改 `package.json`、`pnpm-workspace.yaml`、`nuxt.config.ts`。

### 后续允许范围内可执行

无。当前四个 patch 的最优落点都不在 Theme 包内；在允许文件里新增或删除 patch
不会改善 consumer 的真实兼容性。

### 需要扩大范围后执行

1. 修改 `app/composables/useShiki.ts`：
   - 给 `mountPlain()` 传带尾部空格的 selector；
   - 回归验证后，从 consumer 删除 `plain-shiki` patch。
2. 修改 consumer 的 `pnpm-workspace.yaml` 和 lockfile：
   - 移除 `ipx` patch；
   - 重新生成并检查 favicon、外部 ICO 和 IPX 路径。
3. 维护 consumer 的 `@nuxtjs/mdc` patch：
   - 继续保持 detab-only；
   - 不恢复 inline code hunk。
4. 向外部 upstream 提 issue / PR：
   - `@nuxt/image`：`parseFloat` 与 fractional density 测试；
   - `@nuxtjs/mdc`：跟进 #445，提供可配置方案；
   - `plain-shiki`：修复默认 highlight selector；
   - `ipx`：先讨论 ICO / unsupported transform 的期望语义。

## 验证记录

- `pnpm exec eslint docs/patch-audit.md`：通过。
- `pnpm typecheck`：此前基线已通过；本轮未修改运行时代码。
- `pnpm lint`：本报告无错误；命令仍因 `.test-consumer/package/package/` 中既有的
  generated Vue / package.json lint 问题失败，另有一个既有的 `sync-manifest.json`
  EOL warning。相关文件不在本轮允许修改范围内。
- `pnpm verify`：存在 7 个与本审计无关的既有上游身份 / 统计信息残留检查失败，
  涉及 `docs/theme-audit.md`、`scripts/test-consumer.mjs` 和 generated test consumer。
  这些文件不在本轮允许修改范围内，未处理。
