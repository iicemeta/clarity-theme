import antfu from '@antfu/eslint-config'

export default antfu({
	ignores: ['*.yaml', 'playground/**', '.test-consumer/**'],
	stylistic: {
		indent: 'tab',
	},
	pnpm: true,
	// @keep-sorted
	rules: {
		'jsonc/indent': ['error', 2],
		'vue/block-lang': ['warn', {
			script: { lang: ['ts', 'tsx'] },
			style: { lang: ['scss'] },
		}],
		'vue/enforce-style-attribute': ['warn', {
			allow: ['scoped'],
		}],
		'vue/html-indent': ['error', 'tab', { baseIndent: 0 }],
		'yaml/indent': ['error', 2],
	},
}, {
	// 上游 f6ea97d 中这两个文件的 import 顺序本身不符合 perfectionist 排序（上游 lint 同样报错）。
	// 为保持与上游 byte-identical，不在文件内追加 disable 注释，改在此处豁免；
	// 上游修正后可通过 sync 同步移除。
	// @keep-sorted
	files: [
		'src/components/util/Img.vue',
		'src/components/widget/BlogTech.vue',
	],
	rules: {
		'perfectionist/sort-imports': 'off',
	},
}, {
	files: ['src/pages/**/*.vue', 'playground/app/**/*.vue'],
	rules: {
		'vue/valid-v-slot': 'off',
	},
}, {
	files: ['**/*.json'],
	rules: {
		'style/eol-last': ['warn', 'never'],
	},
}, {
	// runtime/visual parity 测试工具（tests/parity + 驱动脚本）：
	// 进度与失败诊断依赖 stdout 输出，允许 console
	files: ['tests/parity/**/*.mjs', 'scripts/test-runtime-parity.mjs', 'scripts/test-visual-parity.mjs'],
	rules: {
		'no-console': 'off',
	},
})
