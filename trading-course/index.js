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
const log = require('single-line-log').stdout
// console.log = log

// * CONFIGURATION
const subStringsToFilter = ['forex', 'I will update']

async function downloadImages(htmlString, folderPath) {
	const regEx =
		/<img.*(https:\/\/[\w.]*\/wp-content\/uploads\/\d{4}\/\d{2}\/[\w-_]*\.\w{3,4}) \d{4}w"[^<]*>/g
	const matches = regEx.exec(htmlString)
	let text
	if (matches) {
		const imageUrl = matches[1]
		if (imageUrl) {
			const fileName = /\/([^/]*\.\w{3,4})$/.exec(imageUrl)[1]
			if (fileName) {
				const fullPath = path.join(__dirname, 'image-exports', folderPath)
				await fs.mkdir(fullPath, { recursive: true }).catch(() => {}) // make folder
				const filePath = path.join(fullPath, fileName)
				await downloadImage({
					url: imageUrl,
					dest: filePath,
				})

				const pathFromHtmlFile = path.join(
					'../../../',
					'image-exports',
					folderPath,
					fileName,
				)

				htmlString = htmlString.replace(
					regEx,
					`<img src="${pathFromHtmlFile}"/>`,
				)
			}
		}
	}
	return [htmlString]
}

function shorten(string, length) {
	if (string.length > length) {
		return string.substring(0, length - 3) + '...'
	} else return string
}

// GET CONTENT FROM PAGES
const monthToNumber = (month) =>
	new Date(Date.parse(month + ' 1, 2012')).getMonth() + 1

async function getDateFromTime(time) {
	const [monthString, day, year] = await time
		.first()
		.text()
		.split(/\s|,\s?/)

	return [year, monthToNumber(monthString), day, monthString]
}

async function getContentFromPages(urls) {
	for (const [i, url] of Object.entries(urls)) {
		const shortUrl = url.split('market-update/')[1].slice(0, -1)
		log(
			`2. Getting blog post '${shorten(shortUrl, 40)}' [${Number(i) + 1}/${
				urls.length
			}]\n`,
		)
		const $ = await fetchHtml(url)

		const [year, month, day, monthString] = await getDateFromTime($('time'))
		let main = $('main').toString()
		main = main
			.replace(
				/(<p.*>Here are several reasonable.*\s*<p.*\s*<p.*\s*.*<p\/>)/,
				'',
			) // strip away unnecessary end of post
			.replace(/<hr.*/s, '') // strip away unnecessary end of post
			.replace(/<p><em>See the <a rel="noreferrer.*\/em>/, '') // strip away unnecessary end of post
			.replace(/\n\s*</g, '<') // strip whitespace

		let splitByH2s = main.split(/(?=<h2>.*<\/h2>)/).slice(1)
		const html = splitByH2s.filter((string) => {
			const freeOfUnwantedSubStrings = subStringsToFilter.every(
				(subStringToFilter) =>
					!string.toLowerCase().includes(subStringToFilter),
			)
			if (freeOfUnwantedSubStrings) return true
			// return true
		})
		const monthDir = path.join(year, `${month} - ${monthString}`)
		await makeLocalFolder(monthDir)

		for (const [i, string] of html.entries()) {
			const headingInHtml = string.match(/<h2>(.*)<\/h2>/)[1]
			let heading = htmlToText(headingInHtml)
			if (heading.length > 80) heading = heading.slice(0, 80 - 3) + '...'
			if (headingInHtml.includes('Summary')) heading = 'EOD Summary'
			if (headingInHtml.includes('Emini pre')) heading = 'Pre'
			const [htmlWithImagesDownloaded] = await downloadImages(string, monthDir)
			const html = wrapHtml(htmlWithImagesDownloaded)
			await writeLocalFile(
				path.join(monthDir, `${year}-${month}-${day} | ${heading}.html`),
				html,
			)
		}
	}
	console.log('')
}

// GET CONTENT FROM PAGES

/**
 * Gets post urls from list of blog posts
 * @param {string} url
 * @param {number} pageEnd last page of postURLs to get
 * @param {number} pageStart first page of postURLs to get
 */
async function getPostUrls(url, pageEnd = 0, pageStart = 0) {
	const urls = []
	const numPages = pageEnd - pageStart + 1
	for (let pageNumber = pageStart; pageNumber <= pageEnd; pageNumber++) {
		log(
			`1. Getting blog post URLs for page ${pageNumber + 1}... [${
				pageNumber - pageStart + 1
			}/${numPages}]\n`,
		)
		if (pageNumber > 1) url = `${url}/page/${pageNumber}`
		const $ = await fetchHtml(url)
		$('a.entry-title-link').each((i, el) => {
			if (!$(el).text().includes('SP500')) {
				const url = $(el).attr('href')
				urls.push(url)
			}
		})
	}
	console.log('')
	return urls
}

async function scrape() {
	const urls = await getPostUrls(
		'https://www.brookstradingcourse.com/blog/market-update',
	)
	await getContentFromPages(urls)
	log('Done!\n')
}

scrape()
