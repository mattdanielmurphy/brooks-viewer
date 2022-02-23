import {
	clearLog,
	cooldown,
	fetchHtml,
	getDatabase,
	getDateFromTime,
	length,
	logToDatabase,
	makeLocalFolder,
	shortenString,
	wrapHtml,
	writeLocalFile,
} from '../utilities'
import { isNumber, promisify } from 'util'

import { areNumbers } from './util'
import child_process from 'child_process'
import { image as downloadImage } from 'image-downloader'
import { htmlToText } from 'html-to-text'
import { stdout as log } from 'single-line-log'
import { minify } from 'html-minifier'
import path from 'path'

const exec = promisify(child_process.exec)

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
				const src = $(this).attr('src')
				if (srcSet) {
					const splitSrcSet = srcSet.split(' ') // [... https://link-to-image.png 1920w]
					const largestImage = splitSrcSet[splitSrcSet.length - 2]
					imageLink = largestImage
					$(this).removeAttr('srcset')
				} else if (src) {
					imageLink = src
				}

				if (imageLink) {
					$(this).removeAttr('class')
					$(this).removeAttr('sizes')
					$(this).removeAttr('width')
					$(this).removeAttr('height')

					// * images
					const regexMatches = /\.[a-z]{3,4}$/.exec(imageLink)
					if (!regexMatches) throw new Error('Invalid regex... ' + imageLink)
					const fileExtension = regexMatches[0]
					const i = images.length
					const fileName = `${year}-${month}-${day}${
						i > 0 ? `-${i}` : ''
					}${fileExtension}`

					$(this).attr('src', fileName)
					console.log('image fileName', fileName)
					images.push({ src: imageLink, fileName })
				}
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
	const pagesOfUrlsObject = db.data['not-downloaded']
	const pagesOfUrlsArray = Object.entries(pagesOfUrlsObject)
	const totalUrls = pagesOfUrlsArray.reduce((previous, [i, current]) => {
		const urlsArray = Object.values(current)
		return previous + urlsArray.length
	}, 0)

	let urlsDownloaded = -1 // because using 'urlsDownloaded++ to return prev val)
	for (const [i, pageOfUrls] of pagesOfUrlsArray) {
		// for each page of URls
		for (const [j, url] of Object.entries(pageOfUrls)) {
			// for each url of pageOfUrls
			const splitUrl = url.split(/market-update\/|analysis\//)[1]
			if (!splitUrl) continue
			const shortUrl = splitUrl.slice(0, -1)
			log(
				`Downloading blog post '${shortenString(shortUrl, 40)} `,
				`[${urlsDownloaded++ + 2}/${totalUrls}]`,
				`[page ${Number(i) + 1}/${pagesOfUrlsArray.length}]\n`,
			)
			// await cooldown()
			await downloadHtmlAndImagesFromPost(url)

			// * Move from not-downloaded to downloaded in db
			delete db.data['not-downloaded'][i][j]
			// if no page at downloaded create it
			if (!db.data['downloaded'][i]) db.data['downloaded'][i] = { 0: url }
			// if there is, add url
			else db.data['downloaded'][i][j] = url
			await db.write()
		}
		delete db.data['not-downloaded'][i]
		await db.write()
		// break
	}
}

async function getPostUrls(pageEnd = 1, pageStart = 1, rewrite = false) {
	const url = 'https://www.brookstradingcourse.com/blog/market-update'
	// const url = 'https://www.brookstradingcourse.com/blog/analysis'
	const numPages = pageEnd - pageStart + 1
	const db = await getDatabase('postUrls', {
		downloaded: {},
		'not-downloaded': {},
	})

	for (let pageNumber = pageStart; pageNumber <= pageEnd; pageNumber++) {
		log(
			`Getting blog post URLs for page ${pageNumber}... [${
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
			const urlsForPage = {}

			// * get URLs from each post link unless is SP500 post
			$('a.entry-title-link').each((i, el) => {
				if (!$(el).text().includes('SP500')) {
					const url = $(el).attr('href')
					urlsForPage[length(urlsForPage)] = url
				}
			})

			db.data['not-downloaded'][p] = urlsForPage
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
		if (pageNumber < pageEnd) await cooldown()
	}
}

async function createHtmlPage() {
	const dbPath = path.join('html', '2021-11')
	const db = await getDatabase(dbPath)
	const content = db.data[23][0].data[0]
	await writeLocalFile('2021-11-23.html', wrapHtml(String(content)))
}

async function interpretCommandLineInput() {
	function displayHelp() {
		console.log(`HELP:
		\tCOMMANDS:
		\t\tget-urls <endPage> [startPage]
		\t\tdownload-posts`)
	}
	await clearLog()
	const args = process.argv.slice(2)
	if (args.length === 0) throw new Error('No command given')
	switch (args[0]) {
		// case 'create-html-page':
		// 	await createHtmlPage()
		// 	await exec('open ./2021-11-23.html')
		// 	break
		case 'get-urls':
			console.log(args[1], args[2])
			if (!areNumbers(args[1], args[2]))
				throw new Error('Invalid arguments provided for GET-URLs command')

			await getPostUrls(args[1], args[2], args[3] === 'rewrite')
			log('Done! URLs saved to ./data/postUrls.json')
			break
		case 'download-posts':
			await downloadHtmlAndImagesFromPosts()
			log('Done! HTML and images saved to ./data/html/ and ./data/images/')
			break

		default:
			break
	}
}

interpretCommandLineInput()

// async function saveToDatabase() {
// 	const db = await getDatabase('db')
// 	db.data = {
// 		hello: 'man',
// 	}
// 	db.write()
// }
// saveToDatabase()

// await getContentFromPages(urls)
