import type { ContentCollectionItem } from '@nuxt/content'
import { queryCollection } from '@nuxt/content/server'
import XmlBuilder from 'fast-xml-builder'
import { toZonedTemporal } from '../../shared/utils/time'

const runtimeConfig = useRuntimeConfig()

const builder = new XmlBuilder({
	attributeNamePrefix: '$',
	cdataPropName: '$',
	format: true,
	ignoreAttributes: false,
	textNodeName: '_',
})

export default defineEventHandler(async (event) => {
	const { site, feed } = useClarityConfig()
	const themeInfo = runtimeConfig.public.clarity as { theme: string, themeVersion: string, themeHomepage: string }

	function formatIsoDate(date?: string) {
		if (!date)
			return
		try {
			return toZonedTemporal(date, site.timezone).toInstant().toString()
		}
		catch {
			console.error('Invalid date format', date)
			return date
		}
	}

	function getUrl(path: string | undefined) {
		return new URL(path ?? '', site.url).toString()
	}

	function renderContent(post: ContentCollectionItem) {
		return [
			post.image && `<img src="${post.image}" alt="${post.title}" />`,
			post.description && `<p>${post.description}</p>`,
			`<a class="view-full" href="${getUrl(post.path)}" target="_blank">点击查看全文</a>`,
		].filter(Boolean).join(' ')
	}

	const posts = await queryCollection(event, 'content')
		.where('stem', 'LIKE', 'posts/%')
		.order('updated', 'DESC')
		.limit(feed.limit)
		.all()

	const entries = posts.map(post => ({
		id: getUrl(post.path),
		title: post.title ?? '',
		updated: formatIsoDate(post.updated),
		author: { name: (post as any).author || site.author.name },
		content: {
			$type: 'html',
			$: renderContent(post),
		},
		link: { $href: getUrl(post.path) },
		summary: post.description,
		category: { $term: post.categories?.[0] },
		published: formatIsoDate(post.published ?? post.date),
	}))

	const feedData = {
		$xmlns: 'http://www.w3.org/2005/Atom',
		id: site.url,
		title: site.title,
		updated: runtimeConfig.public.buildTime,
		description: site.description,
		author: {
			name: site.author.name,
			email: site.author.email,
			uri: site.author.homepage,
		},
		link: [
			{ $href: getUrl('atom.xml'), $rel: 'self' },
			{ $href: site.url, $rel: 'alternate' },
		],
		language: site.language,
		generator: {
			$uri: themeInfo.themeHomepage,
			$version: themeInfo.themeVersion,
			_: themeInfo.theme,
		},
		icon: site.favicon,
		logo: site.author.avatar,
		rights: `© ${new Date().getFullYear()} ${site.author.name}`,
		subtitle: site.subtitle || site.description,
		entry: entries,
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		'?xml-stylesheet': feed.enableStyle ? { $type: 'text/xsl', $href: '/assets/atom.xsl' } : undefined,
		'feed': feedData,
	})
})
