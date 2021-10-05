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
				console.log(filePath)
				await downloadImage({
					url: imageUrl,
					dest: filePath,
				})

				html = html.replace(re, `<img src="${filePath}"/>`)
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
	// console.log(text)
}

async function getContentFromPages({ pages }) {
	pages.forEach(async (page) => {
		return await page.forEach(async (url) => await getContentFromPage(url))
	})
}

async function getContentFromBlog() {
	await fs.mkdir(path.join(__dirname, 'exports')).catch(() => {}) // make exports folder if not already present
	const urls = await getBlogPostUrlsForNumberOfPages(
		'https://www.brookstradingcourse.com/blog/market-update',
		3,
	)
	// const urls = {
	// 	pages: [
	// 		[
	// 			'https://www.brookstradingcourse.com/market-update/emini-september-rally/',
	// 		],
	// 	],
	// }
	// const content = await getContentFromPage(urls.pages[0][0])
	// const testHtml = `<img loading="lazy" width="680" height="383" src="https://www.brookstradingcourse.com/wp-content/uploads/2021/09/Emini-bull-trend-from-the-open-and-then-parabolic-wedge-midday-bear-trend-reversal-680x383.png" alt="" class="wp-image-122221" srcset="https://www.brookstradingcourse.com/wp-content/uploads/2021/09/Emini-bull-trend-from-the-open-and-then-parabolic-wedge-midday-bear-trend-reversal-680x383.png 680w, https://www.brookstradingcourse.com/wp-content/uploads/2021/09/Emini-bull-trend-from-the-open-and-then-parabolic-wedge-midday-bear-trend-reversal-300x169.png 300w, https://www.brookstradingcourse.com/wp-content/uploads/2021/09/Emini-bull-trend-from-the-open-and-then-parabolic-wedge-midday-bear-trend-reversal-768x432.png 768w, https://www.brookstradingcourse.com/wp-content/uploads/2021/09/Emini-bull-trend-from-the-open-and-then-parabolic-wedge-midday-bear-trend-reversal-1536x864.png 1536w, https://www.brookstradingcourse.com/wp-content/uploads/2021/09/Emini-bull-trend-from-the-open-and-then-parabolic-wedge-midday-bear-trend-reversal.png 1920w" sizes="(max-width: 680px) 100vw, 680px"></a></figure><h3>End of day summary</h3><ul><li>Bull Trend From The Open to far above 50-day MA. </li><li>After breakout phase, there was double bottom bull flag and a triangle. This led to a bull channel to just below the measured move target based on the height of the Triangle.</li><li>The Emini had a midday reversal down from a parabolic wedge buy climax.</li><li>99.95% of days have at least 3 bars with lows below the EMA, which happened today.</li><li>75% of the time, there is then a test of the day’s high after the 20-Gap Bar buy setup. That did not happen today. </li><li>Also, 60% chance Moving Average Gap Bars in a bull trend will lead to a test of the high. That also failed.</li><li>Instead, the selloff to the EMA was also a test of the apex of the earlier triangle. The reversal down was a Midday Bear Trend Reversal, and not just a minor reversal down to the EMA.</li><li>On the daily chart, 4-day rally, but lacked consecutive big bull bars closing on their highs. It therefore looks more like a leg in a trading range than a resumption of the bull trend.</li><li>If there are several bear bars over the next several days, the odds that the 15% correction has begun will remain at 50%.</li><li>If the bulls begin to get bull bars closing near their highs, the 18-month bull trend would then likely be resuming. The odds of a new high before a 15% correction would go up to 60%.</li></ul><p><em>See the <a rel="noreferrer noopener" href="https://www.brookstradingcourse.com/blog/analysis/" target="_blank">weekly update</a> for a discussion of the price action on the weekly chart and for what to expect going into next week.</em></p>`
	await getContentFromPages(urls)
	console.log('Done!')
}

getContentFromBlog()
