const { htmlToText } = require('html-to-text')
const { fetchHtml, writeLocalFile, wrapHtml } = require('./utilities')

// Get URLs

async function getBlogPostUrlsForPage(url) {
	console.log(`fetching links for page @ ${url}...`)
	const $ = await fetchHtml(url)
	const urls = []
	$('a.entry-title-link').each((i, el) => {
		const url = $(el).attr('href')
		urls.push(url)
	})
	return urls
}

/**
 * Gets post urls from list of blog posts
 * @param {string} url
 * @param {number} [pages = 1] number of pages to process (pages value of 2 = get latest page and 1 previous page)
 */
async function getBlogPostUrlsForNumberOfPages(url, pages = 1) {
	const urls = { pages: [] }
	urls.pages.push(await getBlogPostUrlsForPage(url))
	if (pages > 1) {
		for (let pageNumber = 2; pageNumber <= pages; pageNumber++) {
			urls.pages.push(await getBlogPostUrlsForPage(`${url}/page/${pageNumber}`))
		}
	}
	return urls
}

// Get Page Content

async function getHtmlFromPage(url) {
	const $ = await fetchHtml(url)
	const html = []
	$('h2').each((i, cheerioEl) => {
		let el = $(cheerioEl)
		const elString = el.toString()
		if (elString === '<h2>Trading Room</h2>') return

		const h2AndItsContent = { heading: elString, sectionHtml: elString }
		while ((el = el.next())) {
			if (
				el.length === 0 ||
				el.get(0).tagName === 'h2' ||
				el.get(0).tagName === 'hr'
			) {
				break
			} else
				h2AndItsContent.sectionHtml =
					h2AndItsContent.sectionHtml + el.toString()
			console.log(h2AndItsContent)
		}
		html.push(h2AndItsContent)
	})
	return html
}

async function getContentFromPage(url) {
	const html = await getHtmlFromPage(url)
	const text = await Promise.all(
		html.map(async ({ heading, sectionHtml }, i) => {
			await writeLocalFile(`test-${i}.html`, wrapHtml(sectionHtml, heading))
			const sectionText = htmlToText(sectionHtml)
			await writeLocalFile(`test-${i}.txt`, sectionText)
			return sectionText
		}),
	)
	// console.log(text)
}

async function getContentFromBlog() {
	// const urls = await getBlogPostUrlsForNumberOfPages(
	// 	'https://www.brookstradingcourse.com/blog/market-update',
	// 	3,
	// )

	const urls = {
		pages: [
			[
				'https://www.brookstradingcourse.com/market-update/emini-september-rally/',
			],
		],
	}
	const content = await getContentFromPage(urls.pages[0][0])
}

getContentFromBlog()
