import zin from '@zinkawaii/stylelint-config'

/** SCSS 预处理器与 stylelint 默认 CSS 规则的兼容配置 */
const scssCompatRules = {
	'at-rule-no-unknown': [true, {
		ignoreAtRules: [
			'at-root',
			'content',
			'debug',
			'each',
			'else',
			'error',
			'extend',
			'for',
			'forward',
			'function',
			'if',
			'include',
			'mixin',
			'return',
			'use',
			'warn',
			'while',
		],
	}],
	// SCSS 变量（如 $breakpoint-mobile）在媒体查询中无法被 stylelint 解析
	'media-query-no-invalid': null,
}

export default zin({
	// @keep-sorted
	rules: {
		'@stylistic/indentation': 'tab',
		'media-feature-range-notation': 'prefix',
	},
	// 上游 f6ea97d 中这两个文件的属性顺序不符合 order/properties-order（上游自身的
	// stylelint 因未对 .vue 启用 postcss-html 语法而未报错）。为保持 byte-identical，
	// 不改写文件，改在此处豁免；上游修正后可通过 sync 移除。
	// @keep-sorted
	overrides: [
		{
			files: ['src/components/content/Mermaid.vue', 'src/components/content/ProseTable.vue'],
			rules: {
				'order/properties-order': null,
			},
		},

		{
			files: ['**/*.vue'],
			customSyntax: 'postcss-html',
			rules: scssCompatRules,
		},
		{
			files: ['**/*.scss'],
			customSyntax: 'postcss-scss',
			rules: scssCompatRules,
		},
	],
})
