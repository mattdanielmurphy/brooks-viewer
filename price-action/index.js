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
	console.log(`1/2 | Getting blog post URLs for page 1 of ${pages}...`)
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
	if (typeof date !== 'string' || typeof html !== 'object') return // unnecessary really, put here so typescript would shut up
	const [month, day, year] = date.split('-')
	const dayDir = path.join(year, month, day)
	await makeLocalFolder(dayDir)

	const text = await Promise.all(
		html.map(async ({ heading, sectionHtml }, i) => {
			const j = i + 1 // non-zero index for normies
			const dir = path.join(dayDir, `${j}-${heading}`)
			// images are downloaded and refs are replaced with local downloaded ones
			const [sectionHtmlImagesDownloaded, sectionText] = await downloadImages(
				sectionHtml,
				path.join(dir),
				j,
			)
			await makeLocalFolder(dir)
			await writeLocalFile(
				path.join(year, month, `${day}-${j}-${heading}.html`),
				wrapHtml(sectionHtmlImagesDownloaded, heading),
			)
			await writeLocalFile(path.join(dir, `${heading}.txt`), sectionText)
			return sectionText
		}),
	)
}

async function getContentFromPages({ pages }) {
	return await pages.forEach(async (page, i) => {
		console.log(`2/2 | Getting content for page ${i + 1} of ${pages.length}...`)
		return await page.forEach(async (url) => await getContentFromPage(url))
	})
}

async function getContentFromBlog() {
	const urls = await getBlogPostUrlsForNumberOfPages(
		'https://www.brookstradingcourse.com/blog/market-update',
		1,
	)
	await getContentFromPages(urls)
	//! FIX promises; this appears before it should
	//! FIX promises; this appears before it should
	//! FIX promises; this appears before it should
	// console.log('Done!')
}

getContentFromBlog()
