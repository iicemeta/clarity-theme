# Alert

[English](./alert.md) | **简体中文**

## 用途

分类型的提示块，用于真正值得强调的语义：警告、错误、问题，以及丢失会伤害读者的说明。

## 基本语法

```md
::alert{type="warning" title="先备份"}
删除卷的操作不可逆。
::
```

## Props

| Prop | 类型 / 默认值 | 说明 |
| --- | --- | --- |
| `type` | `tip` \| `info` \| `question` \| `warning` \| `error`，默认 `tip` | 决定图标、颜色与默认标题 |
| `title` | string，可选 | 覆盖类型默认标题 |
| `text` | string，可选 | 默认插槽为空时的正文回退 |
| `card` | boolean | 强制卡片样式 |
| `flat` | boolean | 强制扁平样式 |
| `icon` | string | 图标名，例如 `tabler:files` |
| `color` | string | CSS 颜色，例如 `var(--c-accent)` 或 `#F80` |

`card` 与 `flat` 通过 app config 键 `clarity.component.alert.defaultStyle` 解析：默认 `card` 样式下，除非设置 `flat`，否则都是卡片；默认 `flat` 下，设置 `card` 才使用卡片。

## 插槽

- `default` —— 正文；回退到 `text` prop
- `title` —— 富文本标题；回退到 `title` prop，再回退到类型默认（`提醒`/`信息`/`问题`/`警告`/`错误`）

## 支持的取值

类型默认值（来源：`Alert.vue` 的 `typeMap`）：`tip` → `tabler:note`/绿色，`info` → `tabler:info-circle`，`question` → `tabler:help-circle`/蓝色，`warning` → `tabler:alert-triangle`/橙色，`error` → `tabler:circle-x`/红色。

## 示例

```md
::alert{type="error" title="请勿用于生产环境"}
该 API 是实验性的。
::
```

## 嵌套

正文接受 Markdown 与其他行内组件。尽量不要在 Alert 内嵌套容器。

## 何时使用

真实的风险说明、破坏性操作警告、会改变上下文含义的更正，或本节要回答的问题。

## 何时不要使用

普通解释、每个小节的开场白或装饰。如果文章出现成排的 Alert，请改写正文结构。

## 常见错误

- 使用 `type="danger"` —— 不是合法值；应为 `error`。
- 以为 `card`/`flat` 与 app config 无关。
- 把正文写进 `title`。

## 支持状态

`supported` —— 兼容性用例 `C-mdc` 验证。

## 来源

`src/components/content/Alert.vue`；上游 `app/components/content/Alert.vue`；上游语料中的真实用法（61 次容器 + 2 次行内）。
