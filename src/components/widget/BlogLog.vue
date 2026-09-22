<script setup lang="ts">
const clarity = useClarityConfig()

const blogLog = computed(() => {
	const entries = clarity.changelog.map(({ date, text }) => ({ label: date, value: text }))
	if (clarity.site.established) {
		entries.push({ label: clarity.site.established, value: '发布第一篇文章' })
	}
	return entries
})
</script>

<template>
<BlogWidget card title="更新日志">
	<ZDlGroup v-if="blogLog.length" size="large" :items="blogLog" />
	<p v-else class="no-log">
		暂无更新日志，可在 clarity.config.ts 的 changelog 中配置。
	</p>
</BlogWidget>
</template>

<style lang="scss" scoped>
.no-log {
	padding: 1em;
	color: var(--c-text-3);
}
</style>
