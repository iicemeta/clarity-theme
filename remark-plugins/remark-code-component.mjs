import { visit } from 'unist-util-visit'

/**
 * remark-code-component 运行时实现（JS）。
 * 类型真源在同目录 .ts；@nuxt/content 以 Node 原生方式加载插件，
 * 不允许 node_modules 内的 TS 文件（TS 剥离限制），因此运行时必须是 .mjs。
 */
export default function remarkCodeComponent(components = {}) {
	return (tree) => {
		visit(tree, 'code', (node, index, parent) => {
			const options = components[node.lang ?? '']
			if (!options || !parent || index === undefined)
				return

			parent.children.splice(index, 1, {
				type: 'codeComponent',
				children: [],
				data: {
					hName: options.component,
					hProperties: { [options.prop]: node.value },
				},
			})
		})
	}
}
