import {
	clearLog,
	cooldown,
	fetchHtml,
	getDatabase,
	getDateFromTime,
	logToDatabase,
	makeLocalFolder,
	shortenString,
	wrapHtml,
	writeLocalFile,
} from '../utilities'

import { image as downloadImage } from 'image-downloader'
import { exec } from 'child_process'
import { htmlToText } from 'html-to-text'
import { stdout as log } from 'single-line-log'
import { minify } from 'html-minifier'
import path from 'path'

// * CONFIGURATION
const subStringsToFilter = ['forex', 'I will update']

async function saveRawHtml($) {
	const [year, month, day] = await getDateFromTime($('time'))
	$('article').each(function () {
		$(this).find('.essb_links').remove() // (social media)
		$(this).find('footer').remove() // (gravatar images)
	})

	const images = []
	// * Get image links
	$('article').each(function () {
		$(this)
			.find('img')
			.each(function (i) {
				let imageLink = ''
				const srcSet = $(this).attr('srcset')
				if (srcSet) {
					const splitSrcSet = srcSet.split(' ') // [... https://link-to-image.png 1920w]
					const largestImage = splitSrcSet[splitSrcSet.length - 2]
					imageLink = largestImage
					$(this).removeAttr('srcset')
				} else {
					const src = $(this).attr('src')
					imageLink = src
				}
				$(this).removeAttr('class')
				$(this).removeAttr('sizes')
				$(this).removeAttr('width')
				$(this).removeAttr('height')

				// * images
				const fileExtension = /\.[a-z]{3,4}$/.exec(imageLink)[0]
				const fileName = `${year}-${month}-${day}${
					i > 0 ? `-${i}` : ''
				}${fileExtension}`

				$(this).attr('src', fileName)
				images.push({ src: imageLink, fileName })
			})
	})
	$('article.comment-body').each(function () {
		$(this).remove()
	})
	// * Download images
	for (const { src, fileName } of images) {
		const dest = path.join(__dirname, '../', 'data', 'images', fileName)
		await downloadImage({ url: src, dest })
		await cooldown()
	}

	let rawArticle = $('article').toString()
	const article = minify(rawArticle, {
		collapseWhitespace: true,
		collapseInlineTagWhitespace: true,
		continueOnParseError: true,
		minifyCSS: true,
		minifyJS: true,
		minifyURLs: true,
		removeComments: true,
		removeEmptyAttributes: true,
		removeEmptyElements: true,
		removeOptionalTags: true,
		removeRedundantAttributes: true,
	})

	await makeLocalFolder('html')
	const dbPath = path.join('html', `${year}-${month}`)
	const db = await getDatabase(dbPath)

	if (!db.data[day]) db.data[day] = []

	function postOfDate() {
		if (db.data[day].length > 0) {
			return '- ' + db.data[day].length
		} else return ''
	}

	const data = {
		data: [article],
		dateId: `${year}-${month}-${day}${postOfDate()}`,
	}
	db.data[day].push(data)
	await db.write()
	return data.dateId
}

async function downloadHtmlAndImagesFromPost(url) {
	const $ = await fetchHtml(url)
	await saveRawHtml($)
	await cooldown()
}

async function downloadHtmlAndImagesFromPosts() {
	const db = await getDatabase('postUrls')
	// const urls = db.data
	const pagesOfUrls = db.data['not-downloaded']
	for (const [i, page] of Object.entries(pagesOfUrls)) {
		for (const [j, url] of Object.entries(page)) {
			const shortUrl = url.split('market-update/')[1].slice(0, -1)
			log(
				`2. Downloading blog post '${shortenString(shortUrl, 40)}' [${
					Number(i) + 1
				}/${pagesOfUrls.length}]\n`,
			)
			await downloadHtmlAndImagesFromPost(url)
			// * Move from not-downloaded to download in db
			db.data['not-downloaded'][i].splice(j, 1)
			if (!db.data['downloaded'][i]) db.data['downloaded'][i] = [url]
			else db.data['downloaded'][i][j] = url
			await db.write()
		}
		break
	}
}

async function getPostUrls(url, pageEnd = 1, pageStart = 1, rewrite = false) {
	const numPages = pageEnd - pageStart + 1
	const db = await getDatabase('postUrls', {
		downloaded: [],
		'not-downloaded': [],
	})

	for (let pageNumber = pageStart; pageNumber <= pageEnd; pageNumber++) {
		log(
			`1. Getting blog post URLs for page ${pageNumber}... [${
				pageNumber - pageStart + 1
			}/${numPages}]\n`,
		)
		let pageUrl = url
		if (pageNumber > 1) pageUrl = `${url}/page/${pageNumber}`
		const $ = await fetchHtml(pageUrl)

		const p = pageNumber - 1

		const dataDoesNotExist =
			!db.data['not-downloaded'][p] && !db.data['downloaded'][p]

		const downloading = dataDoesNotExist || rewrite

		console.log('')
		if (downloading) {
			const urls = []
			// get URLs from each post link unless is SP500 post
			$('a.entry-title-link').each((i, el) => {
				if (!$(el).text().includes('SP500')) {
					const url = $(el).attr('href')
					urls.push(url)
				}
			})
			db.data['not-downloaded'][p] = urls
			db.write()
			if (rewrite) {
				console.log(`REWRITING: page ${pageNumber} already exists in database`)
				console.log('')
			}
		} else {
			console.log(
				`Error: page ${pageNumber} already exists in database. (enable rewrite to overwrite existing data)`,
			)
			console.log('')
		}
		await cooldown()
	}
}

async function createHtmlPage() {
	const dbPath = path.join('html', '2021-11')
	const db = await getDatabase(dbPath)
	const content = db.data[23][0].data
	await writeLocalFile('2021-11-23.html', wrapHtml(String(content)))
}

// * PROGRAM START

async function downloadPosts() {
	// await getPostUrls(
	// 	'https://www.brookstradingcourse.com/blog/market-update',
	// 	5,
	// 	// 178,
	// )
	// ! Save URLS to JSON and then retrieve them in other fn
	// for each in not-downloaded
	// download, move to downloaded
	await downloadHtmlAndImagesFromPosts()
	log('Done! Raw HTML and images have been saved to `./data`\n')
	// await createHtmlPage()
}
async function prepare() {
	await clearLog()
}

prepare().then(() => downloadPosts())

// async function saveToDatabase() {
// 	const db = await getDatabase('db')
// 	db.data = {
// 		hello: 'man',
// 	}
// 	db.write()
// }
// saveToDatabase()

// await getContentFromPages(urls)
