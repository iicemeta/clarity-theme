export {}

/**
 * 上游同步代码的类型兼容垫片。
 *
 * blog-v3 仓库不运行 typecheck，以下问题在上游真实存在；
 * 为保持同步文件 byte-identical，通过模块增强补齐类型：
 */

declare module '@nuxt/content' {
	interface PageCollectionItemBase {
		/** 上游 atom.xml 读取 post.author（frontmatter 可选字段），上游 schema 未声明 */
		author?: string
	}
}

/// <reference path="./yaml-modules.d.ts" />
