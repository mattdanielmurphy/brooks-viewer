#!/usr/bin/env node

import {
	getDatabase,
	logToDb,
	makeDatabase,
	makeLocalFolder,
} from './utilities'

import { exec } from 'child_process'
import { htmlToText } from 'html-to-text'
import parseInput from './cli-options'
import path from 'path'
import puppeteer from 'puppeteer'

const downloadImage = require('image-downloader').image

const createCsvWriter = require('csv-writer').createArrayCsvWriter

require('dotenv').config()

let signedIn = false

async function setUpPuppeteer() {
	const browser = await puppeteer.launch({ headless: false })
	const page = await browser.newPage()
	// Show console logs from within page.evaluate
	page.on('console', (msg) => {
		for (let i = 0; i < msg.args().length; ++i)
			console.log(`${i}: ${msg.args()[i]}`)
	})
	return [browser, page]
}

async function signIn(page) {
	await page.goto('https://www.brookspriceaction.com/viewforum.php?f=1')
	await page.waitForSelector('input[name="username"]')
	await page.type('input[name="username"]', process.env.USER_NAME)
	await page.type('input[name="password"]', process.env.PASSWORD)
	await Promise.all([
		// Wait for click that triggers navigation
		page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
		page.click('input[name="login"]'),
	])
	await page.waitForSelector('.maintitle')
	signedIn = true
}

async function getListOfPosts(page) {
	if (!page) {
		console.log('no page!')
		return []
	}
	return await page.evaluate(() => {
		const elements = document.querySelectorAll('.row3 .name')
		const results = []
		if (elements.length === 0) {
			console.error(
				'No elements found for selector: ".row3 .name" for page',
				page.toString(),
			)
			return results
		}
		for (const el of elements) {
			const author = el.firstChild.innerText
			const numReplies = el.parentNode.parentNode.querySelectorAll(
				'span.postdetails a[href^="postings_popup.php"]',
			)[0].innerText
			const title =
				el.parentNode.parentNode.querySelectorAll('a.topictitle')[0].innerText
			const url =
				el.parentNode.parentNode.querySelectorAll('a.topictitle')[0].href

			// date
			const regex = RegExp(/\d?\d-\d?\d-\d{4}/)
			const dateStringMatches = regex.exec(title)
			if (!dateStringMatches) {
				console.error('Invalid regex for retrieving date from title:' + title)
			} else {
				const originalDateString = dateStringMatches && dateStringMatches[0]
				const [monthString, dayString, yearString] =
					originalDateString.split('-')
				const dateString = yearString + '-' + monthString + '-' + dayString
				results.push([title, author, numReplies, url, dateString])
			}
		}
		return results
	})
}

async function getAnalysisPostsForPage(page) {
	const posts = await getListOfPosts(page)
	return await posts.filter(([title, author, numReplies]) => {
		function titleDoesNotContain() {
			const args = [].slice.call(arguments)
			return args.every(
				(string) => !title.toLowerCase().includes(string.toLowerCase()),
			)
		}

		return (
			(titleDoesNotContain('no webinar', 'holiday') && author === 'AlBrooks') ||
			(author === 'BPAAdmin' && numReplies > 0)
		)
	})
}

async function renameExtension(pathToDir) {
	const fs = require('fs')

	pathToDir = path.join(__dirname, '../', pathToDir)
	fs.readdirSync(pathToDir).forEach((fileName) => {
		const existingPath = path.join(pathToDir, fileName)
		const newPath = pathToDir + '.png'
		fs.rename(existingPath, newPath, () => {
			fs.rmdirSync(pathToDir)
		})
	})
}

async function saveBarByBarAnalysisToDisk(analysis, year, month, day) {
	const pathToDatabaseFile = path.join('html', `${year}-${month}`)
	const db = await getDatabase(pathToDatabaseFile, {})
	if (db.data[day]) {
		console.log('duplicate analysis for day', year, month, day)
	}
	db.data[day] = analysis
	await db.write()
}

async function savePosts(page, analysisPosts) {
	if (!analysisPosts) return
	analysisPosts = Object.values(analysisPosts)
	const db = await getDatabase('db')
	for (const [i, post] of analysisPosts.entries()) {
		const { url, dateString } = post
		const [year, monthString, dayString] = dateString.split('-')
		const month = monthString.replace(/0?(\d?\d)/, '$1') // remove leading zero
		const day = dayString.replace(/0?(\d?\d)/, '$1') // remove leading zero
		if (!year || !month || !day) {
			console.log('Error: date item not found\n', dateString, '\n', url, '\n')
		}

		if (db.data.daysSavedToDisk.includes(year + '-' + month + '-' + day)) {
			process.stdout.write(
				`Post ${i + 1} of ${analysisPosts.length} already exists.\n\r`,
			)
			continue
		}
		process.stdout.write(
			`Scraping post ${i + 1} of ${analysisPosts.length}... (${url})\r`,
		)

		await page.goto(url)
		let skipPage = false
		await page.waitForSelector('div.quote', { timeout: 100 }).catch((err) => {
			console.log('No quote block for page\n', page.url(), '\n')
			skipPage = true
		})
		if (skipPage) continue
		// first quote:
		//   each bar is after a <br>
		const imageSrc = await page.evaluate(
			() => document.querySelectorAll('.postbody img')[0].src,
		)

		const analysisHTML = await page.evaluate(
			() => document.querySelectorAll('div.quote')[0].innerHTML,
		)
		const splitAnalysisHTML = analysisHTML.split('<br>')
		const analysis = splitAnalysisHTML.reduce((filtered, string) => {
			const text = htmlToText(string)
			console.log(text)
			const matches = text.match(/^-?(\d{1,2})\s(.*)/s) // only thing that doesn't match is '/n'
			if (matches) {
				const [, barNumber, description] = matches
				filtered.push({ barNumber, description })
			}
			// console.log(filtered)
			return filtered
		}, [])

		// // * IMAGES
		// const imageName = dateString
		// const imagePath = path.join('data', 'images', imageName)
		// await makeLocalFolder(imagePath)
		// const fullImagePath = path.join(__dirname, '../', imagePath)
		// await downloadImage({ url: imageSrc, dest: fullImagePath }).catch((err) => {
		// 	console.log('error downloading image: ' + { imageSrc, fullImagePath })
		// 	logToDb({ imageSrc, fullImagePath })
		// })

		// // * RENAME IMAGE EXTENSION SO CAN OPEN
		// await renameExtension(imagePath)

		await saveBarByBarAnalysisToDisk(analysis, year, month, day)
		db.data.daysSavedToDisk.push(`${year}-${month}-${day}`)
		await db.write()
	}
}

async function scrapeAllPages(page, firstPage = 0, lastPage = 1) {
	const db = await getDatabase('db', {
		monthsSavedToDisk: [],
		posts: {},
		daysSavedToDisk: [],
	})
	const lastPossibleIndex = 3150
	const lastIndex = Math.min(lastPage * 50, lastPossibleIndex)

	if (!signIn) await signIn(page)
	for (let i = firstPage; i <= lastIndex; i += 50) {
		if (i === 0) {
			await page.goto('https://www.brookspriceaction.com/viewforum.php?f=1')
		} else {
			await page.goto(
				`https://www.brookspriceaction.com/viewforum.php?f=1&topicdays=0&start=${i}`,
			)
		}
		const analysisPosts = await getAnalysisPostsForPage(page)
		for (const post of analysisPosts) {
			const [, , , url, dateString] = post
			// console.log(`getting: ${url} ... ${dateString}`)
			const [year, monthString, dayString] = dateString.split('-')
			const month = monthString.replace(/0?(\d?\d)/, '$1') // remove leading zero
			const day = dayString.replace(/0?(\d?\d)/, '$1') // remove leading zero
			if (!db.data.posts[year]) {
				db.data.posts[year] = {}
			}
			if (!db.data.posts[year][month]) {
				db.data.posts[year][month] = {}
			}
			db.data.posts[year][month][day] = {
				url,
				dateString,
			}
			await db.write()
		}
		// const [title, author, numReplies, url, dateString] = analysisPosts
	}
}

async function getPostsForMonth(page, year, month) {
	const db = await getDatabase('db')
	// if current month, scrape 1st page, redownload CSVs
	const currentMonth = new Date().getMonth() + 1
	const currentYear = new Date().getFullYear()
	const monthIsCurrentMonth = currentMonth === month && currentYear === year
	const inFuture = new Date(year, month - 1).getTime() > new Date().getTime()
	if (inFuture) {
		console.log('Date is in future. All done.')
		return []
	}
	// if CSV not saved already, fetch it
	if (monthIsCurrentMonth) {
		if (!signedIn) await signIn(page)
		process.stdout.write(
			'Scraping page 1 because searching for current month...',
		)
		await scrapeAllPages(page)
		console.log('pages scraped')
		const posts = db.data.posts[year][month]
		await savePosts(page, posts)
		db.data.monthsSavedToDisk.push(`${year}-${month}`)
		await db.write()
		console.log('posts saved')
	} else if (db.data.monthsSavedToDisk.includes(year + '-' + month)) {
		console.log('files already exist')
		// open folder
	} else {
		const posts = db.data.posts[year][month]
		// ! Needs to check if posts exist, if they don't, must scrape more
		if (posts) {
			if (!signedIn) await signIn(page)
			await savePosts(page, posts)
			db.data.monthsSavedToDisk.push(`${year}-${month}`)
			await db.write()
		} else
			console.error(
				'Error: no posts found for that month in database (you must scrape further back)',
			)
	}
	const dirPath = path.join(
		__dirname,
		'/..',
		'exports',
		String(year),
		String(month),
	)
	exec(`explorer.exe "${dirPath}"`)
}

async function getPostsForYear(page, year) {
	for (let month = 1; month <= 12; month++) {
		console.log('Getting posts for ', year + '-' + month, '\n')
		await getPostsForMonth(page, year, month)
	}
}

async function scrape() {
	// const [year, month] = await parseInput()
	const [browser, page] = await setUpPuppeteer()

	// * TO SCRAPE
	// await scrapeAllPages(page)

	// const year = 2021
	// const month = 1
	// await getPostsForMonth(page, year, month)

	for (let year = 2020; year >= 2015; year--) {
		console.log('Getting posts for ', year, '...')
		await getPostsForYear(page, year)
		console.log('Done getting posts for ', year, '\n')
	}
	browser.close()
}

scrape()
