# Badge

[English](./badge.md) | **简体中文**

## 用途

紧凑的行内徽章，用于点名技术、站点或人物，可选外链。

## 基本语法

```md
基于 :badge[Nuxt]{link="https://nuxt.com"} 与 :badge[GitHub]{link="https://github.com"} 构建。
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `text` | string | 未给方括号文本时的插槽回退 |
| `link` | string | 让徽章成为链接；同时驱动自动配图与提示 |
| `img` | string | 显式图片 URL；关闭自动探测 |
| `round` | boolean | 无图时使用圆形样式 |
| `square` | boolean | 有图时使用方形样式 |

自动配图解析（来源：`Badge.vue`）：显式 `img` → 由 GitHub `link` 推导头像 → 外链 `link` 的 favicon → 无图。有图时默认圆形除非 `square`；无图时默认方形除非 `round`。提示显示外链域名或解码后的内部链接。

## 插槽

- `default` —— 徽章文本；回退到 `text`

## 支持的取值

任意字符串 props。`link` 接受内部路径或外部 URL。

## 示例

```md
:badge[纯文本指定圆形]{round} :badge[带个图]{img="https://example.com/a.png"}
```

## 嵌套

仅行内；不要放入块级内容。

## 何时使用

正文中的技术名称、少量相关站点，或完整链接卡过重的署名场景。

## 何时不要使用

长标签（用 link card）、每个名词后面的重复装饰，或替代普通链接。

## 常见错误

- 以为 `round`/`square` 与是否解析出图片无关。
- 省略 `link` 却期待自动配图——自动图片来自 `link`。

## 支持状态

`supported` —— 兼容性用例 `C-mdc` 验证（含消费者覆盖组件的场景）。

## 来源

`src/components/content/Badge.vue`；上游用法集中在展示文章。
