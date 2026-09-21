/**
 * rehype-meta-slots 运行时实现（JS）。
 * 类型真源在同目录 .ts；@nuxt/content 以 Node 原生方式加载插件，
 * 不允许 node_modules 内的 TS 文件（TS 剥离限制），因此运行时必须是 .mjs。
 */
export function fromHast(node) {
	return {
		props: node.properties,
		type: 'minimark',
		value: node.children.map(hastToMinimarkNode).filter(v => v !== undefined),
	}
}

function hastToMinimarkNode(input) {
	if (input.type === 'comment' || input.type === 'doctype') {
		return undefined
	}
	if (input.type === 'text' || input.type === 'raw') {
		return input.value
	}

	if (input.tagName === 'code' && input.properties?.className && input.properties.className.length === 0) {
		delete input.properties.className
	}

	return [
		input.tagName,
		input.properties || {},
		...(input.children || []).map(hastToMinimarkNode).filter(v => v !== undefined),
	]
}

export default function rehypeMetaSlots() {
	return (tree, file) => {
		file.data.slots ??= {}

		for (let i = 0; i < tree.children.length; i++) {
			const node = tree.children[i]

			if (node.type === 'element' && node.tagName.startsWith('meta-')) {
				const metaName = node.tagName.slice('meta-'.length)
				file.data.slots[metaName] = fromHast(node)

				tree.children.splice(i, 1)
				i--
			}
		}
	}
}
