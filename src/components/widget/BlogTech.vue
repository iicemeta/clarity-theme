<script setup lang="ts">
import { Icon } from '#components'

const clarity = useClarityConfig()
const runtimeConfig = useRuntimeConfig()
const buildInfo = runtimeConfig.public.clarity as {
	theme: string
	themeVersion: string
	siteVersion: string
	sitePackageManager: string
	nuxtVersion: string
	vueVersion: string
}
const { public: { arch, ci, nodeVersion, platform } } = runtimeConfig

const [packageManager, packageManagerVersion] = buildInfo.sitePackageManager.split('@') as [string, string]

const ciPlatform = computed(() => {
	const iconName = ciIcons[ci]
	if (!iconName)
		return ''

	const iconNode = iconName.startsWith('http')
		? h('img', { src: iconName, alt: '' })
		: h(Icon, { name: iconName })

	return h('span', {}, [iconNode, ` ${ci.split(' ')[0]}`])
})

const service = computed(() => ([
	...ci ? [{ label: '构建平台', value: ciPlatform }] : [],
	{ label: '图片存储', value: () => [h(Icon, { name: 'devicon:cloudflare' }), ' R2'] },
	{ label: '软件协议', value: 'MIT' },
	{ label: '文章许可', value: clarity.site.copyright?.abbr || '未配置' },
	{ label: '规范域名', value: getDomain(clarity.site.url) },
]))

const techstack = computed(() => ([
	{ label: 'Blog', value: buildInfo.siteVersion || '--' },
	{ label: 'Theme', value: `${buildInfo.theme} ${buildInfo.themeVersion}` },
	{ label: 'Vue', value: buildInfo.vueVersion },
	{ label: 'Nuxt', value: buildInfo.nuxtVersion },
	{ label: 'Node', value: nodeVersion },
	...(packageManager ? [{ label: packageManager, value: packageManagerVersion }] : []),
	{ label: 'OS', value: platform },
	{ label: 'Arch', value: arch },
]))

const expand = ref(false)
</script>

<template>
<BlogWidget card grayscale title="技术信息">
	<ZDlGroup :items="service" />
	<ZExpand v-model="expand" in-place name="构建信息">
		<ZDlGroup size="small" :items="techstack" />
	</ZExpand>
</BlogWidget>
</template>

<style lang="scss" scoped>
.z-expand {
	margin-top: 0.2em;
}

.dl-group :deep(img) {
	height: 1.2em;
	vertical-align: sub;
}
</style>
