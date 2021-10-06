const { htmlToText } = require('html-to-text')
const {
	fetchHtml,
	writeLocalFile,
	wrapHtml,
	makeLocalFolder,
} = require('./utilities')
const downloadImage = require('image-downloader').image
const path = require('path')
const fs = require('fs').promises

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
	console.log(`1/2 | Getting blog post URLs for page 1/${pages}...`)
	urls.pages.push(await getBlogPostUrlsForPage(url))
	if (pages > 1) {
		for (let pageNumber = 2; pageNumber <= pages; pageNumber++) {
			console.log(
				`1/2 | Getting blog post URLs for page ${pageNumber} of ${pages}...`,
			)
			urls.pages.push(await getBlogPostUrlsForPage(`${url}/page/${pageNumber}`))
		}
	}
	return urls
}

// Get Page Content

async function getHtmlFromPage(url) {
	const $ = await fetchHtml(url)
	const date = $('time')
		.first()
		.text()
		.replace(/ at.*/, '')
		.replace(/(,?\s)/g, '-')

	const html = []
	$('h2').each((i, cheerioEl) => {
		let el = $(cheerioEl)
		const elString = el.toString()
		if (elString === '<h2>Trading Room</h2>') return

		const h2AndItsContent = { heading: el.text(), sectionHtml: elString }
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
		}
		html.push(h2AndItsContent)
	})
	return [html, date]
}

async function downloadImages(html, folderPath, i) {
	const re =
		/<img.*(https:\/\/[\w.]*\/wp-content\/uploads\/\d{4}\/\d{2}\/[\w-_]*\.\w{3,4}) \d{4}w"[^<]*>/g
	const matches = re.exec(html)
	let text
	if (matches) {
		const imageUrl = matches[1]
		if (imageUrl) {
			const fileName = /\/([^/]*\.\w{3,4})$/.exec(imageUrl)[1]
			if (fileName) {
				makeLocalFolder(folderPath)
				const filePath = path.join(
					__dirname,
					'exports',
					folderPath,
					`${i}-${fileName}`,
				)
				await downloadImage({
					url: imageUrl,
					dest: filePath,
				})

				html = html.replace(re, `<img src="${filePath}"/>`)
				// ! NEED TO FIX: (not removing image tag)
				// ! NEED TO FIX: (not removing image tag)
				// ! NEED TO FIX: (not removing image tag)
				// ! NEED TO FIX: (not removing image tag)
				text = htmlToText(html.replace(re, ''))
			}
		}
	} else {
		text = htmlToText(html)
	}
	return [html, text]
}

async function getContentFromPage(url) {
	const [html, date] = await getHtmlFromPage(url)
	if (typeof date !== 'string' || typeof html !== 'object') return
	await makeLocalFolder(date)

	const text = await Promise.all(
		html.map(async ({ heading, sectionHtml }, i) => {
			const dir = path.join(date, `${i}-${heading}`)
			await makeLocalFolder(dir)
			const [sectionHtmlImagesDownloaded, sectionText] = await downloadImages(
				sectionHtml,
				path.join(dir, 'images'),
				i,
			)
			await writeLocalFile(
				path.join(date, `${i}-${heading}.html`),
				wrapHtml(sectionHtmlImagesDownloaded, heading),
			)
			await writeLocalFile(path.join(dir, `${heading}.txt`), sectionText)
			return sectionText
		}),
	)
}

async function getContentFromPages({ pages }) {
	pages.forEach(async (page, i) => {
		console.log(`Getting content for page ${i} of ${pages.length}...`)
		return await page.forEach(async (url) => await getContentFromPage(url))
	})
}

async function getContentFromBlog() {
	await fs.mkdir(path.join(__dirname, 'exports')).catch(() => {}) // make exports folder if not already present
	const urls = await getBlogPostUrlsForNumberOfPages(
		'https://www.brookstradingcourse.com/blog/market-update',
		3,
	)
	await getContentFromPages(urls)
	console.log('Done!')
}

getContentFromBlog()
