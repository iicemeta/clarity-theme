# Tip

[English](./tip.md) | **简体中文**

## 用途

虚线下划线的行内提示：悬停（或聚焦）显现简短解释，不必离开段落。

## 基本语法

```md
术语 :tip[APF]{tip="Advanced Page Flow"} 稍后还会出现。
```

## Props

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `text` | string | 插槽回退 |
| `tip` | string | 提示内容 |
| `icon` | string \| boolean | 图标名；裸写 `icon` 显示默认图标 |
| `copy` | boolean | 点击复制插槽文本；提示变为“点击复制” |
| `tipOptions` | `TippyOptions` | 提示行为的逃生舱 |

## 插槽

- `default` —— 可见术语；回退到 `text`

## 支持的取值

简短提示字符串；`icon=false` 隐藏图标。

## 示例

```md
:tip[没有图标]{icon tip="也可以"} · :tip[npm 命令]{copy text="pnpm i"}
```

## 嵌套

仅行内。

## 何时使用

需要一句话注释的行话；小的可复制令牌。

## 何时不要使用

值得用一整句解释的定义（直接写出来），或承载安全关键信息的提示（触屏用户可能错过）。

## 常见错误

- 又长又多句的提示内容。
- 把 `icon` 设为字符串又期待复制图标——设置 icon 后它优先。

## 支持状态

`supported` —— 兼容性用例 `C-mdc` 验证。

## 来源

`src/components/content/Tip.vue`；上游语料中 21 次。
