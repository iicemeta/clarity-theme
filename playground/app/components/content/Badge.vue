<script setup lang="ts">
// Consumer Override Test（devdoc2.0 §28）：
// 同路径组件覆盖 Theme 组件，验证优先级 Consumer component > Theme component
const props = defineProps<{
	img?: string
	text?: string
	link?: string
	round?: boolean
	square?: boolean
}>()

const img = computed(() => {
	if (props.img)
		return props.img
	const ghUsername = getGithubUsername(props.link)
	if (ghUsername)
		return getGithubAvatar(ghUsername)
	if (props.link && isExtLink(props.link))
		return getFavicon(getDomain(props.link))
	return ''
})

const round = computed(() => img.value ? !props.square : props.round)

const tip = computed(() => {
	if (!props.link)
		return ''
	if (isExtLink(props.link))
		return getDomain(props.link)
	return safelyDecodeUriComponent(props.link)
})
</script>

<template>
<UtilLink v-tip="tip" class="badge" :class="{ round }" :to="link" data-consumer-override="badge">
	<NuxtImg v-if="img" class="badge-icon" :src="img" alt="" densities="1x" />
	<span class="badge-text">
		<slot>{{ text }}</slot>
	</span>
</UtilLink>
</template>

<style lang="scss" scoped>
.badge {
	display: inline-flex;
	align-items: baseline;
	margin: 0.1em;
	border: 1px solid var(--c-border);
	border-radius: 4px;
	box-sizing: content-box;
	background-color: var(--c-bg-2);
	font-size: 0.875em;
	transition: color 0.2s;

	&[href]:hover {
		color: var(--c-text);
	}

	&.round, &.round > .badge-icon {
		border-radius: 0.8em;
	}
}

.badge-icon {
	align-self: normal;
	height: 1.6em;
	border-radius: 3.5px;

	+ .badge-text {
		margin-inline-start: -0.1em;
	}
}

.badge-text {
	padding: 0.2em 0.4em;
	line-height: 1.2;

	&:empty {
		display: none;
	}
}
</style>
