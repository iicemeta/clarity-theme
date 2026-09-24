/**
 * Layer 级 app.config。
 *
 * UI 默认值由 src/modules/clarity-config 从 src/config/ui.ts 注入（inline 层），
 * 此处仅提供需要字面量类型的键：pagination.sortOrder 若由模块注入，
 * JSON 字面量会被宽化为 string，导致上游 useArticle 的
 * ref<ArticleOrderType>(initialOrder) 类型不匹配。以 Layer cfg 提供
 * 'date' 字面量（运行时与默认值一致，可被消费项目顶层键覆盖）。
 */
export default defineAppConfig({
	pagination: {
		sortOrder: 'date' as const,
	},
})
