const { htmlToText } = require('html-to-text')
const { fetchHtml, writeLocalFile } = require('./utilities')

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

async function getContentFromPage(url) {
	const $ = await fetchHtml(url)
	function getContentUntilNextH2Tag(currentH2Tag, content, nextH2Tag) {}

	const content = ['']
	const firstH2Tag = $('h2')
	const h2Text = firstH2Tag.text()
	getContentUntilNextH2Tag(firstH2Tag)
	// retrieve text under each h2
	// find first h2 tag
	// use getNextSibling until you find another h2 tag, then separate and continue
	// stop at <hr class="wp-block-separator">
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
