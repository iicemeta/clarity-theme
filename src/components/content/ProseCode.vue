<script setup lang="ts">
import type { VNode } from 'vue'

const props = defineProps<{
	language?: string
	/**
	 * 代码原文。
	 * MDC 原生行为中 inline code 通过默认插槽（text VNode）传递，
	 * 上游 @nuxtjs/mdc patch（inline code props.code 传入原文）存在时走此 prop，
	 * fenced code（ProsePre 内部）也始终通过此 prop 传递。
	 */
	code?: string
	copy?: boolean
}>()

const slots = useSlots()

/** 从插槽 VNode 中递归提取纯文本 */
function extractText(vnode: VNode): string {
	if (typeof vnode.children === 'string')
		return vnode.children
	if (Array.isArray(vnode.children))
		return (vnode.children as VNode[]).map(extractText).join('')
	return ''
}

/** 无 patch 时以插槽文本作为原文，有 patch 时优先使用 code prop */
const rawCode = computed(() => {
	if (props.code !== undefined)
		return props.code
	return (slots.default?.() ?? []).map(extractText).join('')
})

const { copy: copyCode, copied } = useCopy(rawCode.value)
const shiki = useShiki()
const codeElement = useTemplateRef('code')
const highlighted = ref(false)

onMounted(async () => {
	if (!props.language)
		return
	await shiki.mountInline(codeElement.value!, rawCode.value, {
		language: props.language,
		transformerOptions: ['ignoreColorizedBrackets'],
	})
	highlighted.value = true
})
</script>

<template>
<code ref="code" :class="{ copyable: copy }">
	<template v-if="!language || !highlighted">
		<slot>{{ rawCode }}</slot>
	</template>
	<Icon v-if="copy" v-show="false" name="tabler:check" />
	<button v-if="copy" type="button" class="copy-button" aria-label="复制" @click="copyCode()">
		<Icon :name="copied ? 'tabler:check' : 'tabler:copy'" />
	</button>
</code>
</template>

<style lang="scss" scoped>
code {
	margin: 0.1em;
	padding: 0.1rem 0.3em;
	border: 1px solid var(--c-border);
	border-radius: 4px;
	background-color: var(--c-bg-2);
	font-size: 0.85em;
	white-space: break-spaces;

	&.copyable {
		padding-inline-end: 0.1em;
	}

	@supports (color: color-mix(in srgb, transparent, transparent)) {
		border-color: color-mix(in srgb, currentcolor 10%, transparent);
		background-color: color-mix(in srgb, currentcolor 5%, transparent);
	}
}

.copy-button {
	display: inline-flex;
	margin-inline-start: 0.2em;
	vertical-align: -0.2em;
	color: var(--c-text-3);
	transition: color 0.2s;

	&:hover,
	&:focus-visible {
		opacity: 1;
		color: var(--c-primary);
	}
}
</style>
