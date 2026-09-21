import XmlBuilder from 'fast-xml-builder'
import type { FeedEntry, FeedGroup } from '../../app/types/feed'
import { toZonedTemporal } from '../../shared/utils/time'

const runtimeConfig = useRuntimeConfig()

const builder = new XmlBuilder({
	attributeNamePrefix: '$',
	format: true,
	ignoreAttributes: false,
})

function mapEntry(item: FeedEntry, timeZone: string) {
	return {
		$text: item.title || item.sitenick || item.author,
		$type: 'rss',
		$xmlUrl: item.feed,
		$created: toZonedTemporal(item.date, timeZone).toInstant().toString(),
		$description: item.desc,
		$htmlUrl: item.link || item.feed,
	}
}

function flattenGroups(groups: FeedGroup[], timeZone: string) {
	return groups.flatMap(({ entries }) => entries.filter(({ feed }) => feed).map(item => mapEntry(item, timeZone)))
}

export default defineEventHandler(async () => {
	const { site } = useClarityConfig()
	const feeds = (await import('#clarity/feeds')).default as FeedGroup[]
	const myFeed: FeedEntry = {
		author: site.author.name,
		title: site.title,
		desc: site.subtitle || site.description,
		link: site.url,
		feed: new URL('/atom.xml', site.url).toString(),
		icon: site.favicon,
		avatar: site.author.avatar || site.favicon,
		date: site.established || '',
	}

	const outlines = [
		mapEntry(myFeed, site.timezone),
		...flattenGroups(feeds, site.timezone),
	]

	const opml = {
		$version: '2.0',
		head: {
			title: `${site.title}的友链订阅`,
			dateCreated: site.established
				? toZonedTemporal(site.established, site.timezone).toInstant().toString()
				: undefined,
			dateModified: runtimeConfig.public.buildTime,
			ownerName: site.author.name,
			ownerEmail: site.author.email,
			ownerId: site.author.homepage,
			docs: 'https://opml.org/spec2.opml',
		},
		body: { outline: outlines },
	}

	return builder.build({
		'?xml': { $version: '1.0', $encoding: 'UTF-8' },
		opml,
	})
})
