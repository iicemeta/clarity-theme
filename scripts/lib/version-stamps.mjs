/**
 * 版本快照判定（供 scripts/check-docs.mjs 与 tests/docs-governance.test.mjs 共用）。
 *
 * 语义：区分「会随下一次发布过期的当前版本快照」与「对某个发布本身的合法描述」。
 * 规则只拦前者。历史事实、迁移对照、安装范围与发布来源记录中的版本引用是合法内容。
 */

/**
 * @param {string[]} lines 文档按行拆分后的内容
 * @param {string} version 当前 release 版本（package.json 的 version）
 * @returns {{ line: number, kind: string, snippet: string }[]} 命中的快照行（行号从 1 起）与判定类别；无快照时为空数组
 */
export function findVersionStamps(lines, version) {
	const v = version.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
	const patterns = [
		// 版本断言标签绑定：`Version: 0.2.0`、`Current release = 0.2.0`、`Latest stable version: 0.2.0`
		['label', new RegExp(String.raw`(?<![\w.#-])(?:current|latest|stable|released?)?\s*?(?:version|release)\s*[:=]\s*v?${v}\s*$`, 'i')],
		// 中文等价：`当前版本：0.2.0`、`最新版本号：0.2.0`
		['label-zh', new RegExp(String.raw`(?:当前|最新|稳定)?版本(?:号)?\s*[:：=]\s*v?${v}\s*$`)],
		// 断言句：`the latest version is 0.2.0`
		['assertion', new RegExp(String.raw`(?:version|release)\s+(?:is|为|是)\s+v?${v}\b`, 'i')],
		// 元数据表格：标签单元格是版本名词，值单元格恰好是版本。迁移对照表 `| 0.1.x | 0.2.0 |`
		// 的标签单元格是另一个版本线，不是版本名词，因此不命中。
		['table', new RegExp(String.raw`\|\s*(?:current|latest|stable|released?)?\s*?(?:version|release)\s*\|\s*v?${v}\s*\|`, 'i')],
		['table-zh', new RegExp(String.raw`\|\s*(?:当前|最新|稳定)?版本(?:号)?\s*\|\s*v?${v}\s*\|`)],
		// 精确包版本钉死：`clarity-theme@0.2.0`。`^0.2.0` / `>=0.2.0 <0.3.0` 是范围，不是钉死。
		['pin', new RegExp(String.raw`[\w.-]+@${v}(?![\w.-])`)],
		// 独立成行 / 版本标题：`## 0.2.0`
		['standalone', new RegExp(String.raw`^#{0,6}\s*v?${v}\s*$`)],
	]
	const found = []
	lines.forEach((line, index) => {
		for (const [kind, pattern] of patterns) {
			if (pattern.test(line)) {
				found.push({ line: index + 1, kind, snippet: line.trim() })
				return
			}
		}
	})
	return found
}
