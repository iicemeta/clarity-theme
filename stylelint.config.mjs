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
	overrides: [
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
