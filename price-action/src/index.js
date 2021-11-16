#!/usr/bin/env node

import { JSONFile, Low } from 'lowdb'

import { exec } from 'child_process'
import { htmlToText } from 'html-to-text'
import { makeLocalFolder } from './utilities'
import parseInput from './cli-options'
import path from 'path'
import puppeteer from 'puppeteer'

const downloadImage = require('image-downloader').image

const createCsvWriter = require('csv-writer').createArrayCsvWriter

require('dotenv').config()

// Use JSON file for storage
const file = path.join(__dirname, '/..', 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)

// set default data
// db.data ||= { posts: {} }
// db.write()

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
}

async function getListOfPosts(page) {
	return await await page.evaluate(() => {
		const elements = document.querySelectorAll('.row3 .name')
		const results = []
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
			const regex = RegExp(/\d\d-\d\d-\d{4}/)
			const originalDateString = regex.exec(title)[0]
			const [monthString, dayString, yearString] = originalDateString.split('-')
			const dateString = yearString + '-' + monthString + '-' + dayString
			results.push([title, author, numReplies, url, dateString])
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

async function savePostsToCSVs(page, analysisPosts) {
	for (const [i, post] of analysisPosts.entries()) {
		const { url, dateString } = post
		const [yearString, monthString, dayString] = dateString.split('-')
		if (
			db.data.daySavedAsCSV.includes(
				yearString + '-' + monthString + '-' + dayString,
			)
		) {
			process.stdout.write(
				`Post ${i + 1} of ${analysisPosts.length} already exists.\r`,
			)
			continue
		}
		process.stdout.write(`Scraping post ${i + 1} of ${analysisPosts.length}\r`)

		await page.goto(url)
		await page
			.waitForSelector('div.quote')
			.catch((err) =>
				error.log('Error looking for quote block... is this an old post?', err),
			)
		// first quote:
		//   each bar is after a <br>
		const imageSrc = await page.evaluate(
			() => document.querySelectorAll('.postbody img')[0].src,
		)

		const analysisHTML = await page.evaluate(
			() => document.querySelectorAll('div.quote')[0].innerHTML,
		)
		const splitAnalysisHTML = analysisHTML.split('<br>')
		const analysis = splitAnalysisHTML.map((string) => [htmlToText(string)])

		await makeLocalFolder(yearString, monthString)
		const dirPath = path.join(
			__dirname,
			'/..',
			'exports',
			yearString,
			monthString,
		)
		const csvPath = path.join(
			dirPath,
			`${yearString}-${monthString}-${dayString}.csv`,
		)
		const imagePath = path.join(
			dirPath,
			`${yearString}-${monthString}-${dayString}.png`,
		)
		await downloadImage({
			url: imageSrc,
			dest: imagePath,
		})
		const csvWriter = createCsvWriter({
			path: csvPath,
			header: [url],
		})
		await csvWriter.writeRecords(analysis)
		if (!db.data.monthSavedAsCSV.includes(yearString + '-' + monthString))
			db.data.monthSavedAsCSV.push(yearString + '-' + monthString)

		// checked for daySaved at top
		db.data.daySavedAsCSV.push(yearString + '-' + monthString + '-' + dayString)
		await db.write()
	}
}

async function scrapeAllPages(page, onlyFirstPage) {
	await db.read()
	const finalIndex = onlyFirstPage ? 0 : 3150
	// for (let i = 0; i < 3150; i += 50) {
	for (let i = 0; i < finalIndex; i += 50) {
		if (i === 0) {
			await page.goto('https://www.brookspriceaction.com/viewforum.php?f=1')
			await signIn(page)
		} else {
			await page.goto(
				`https://www.brookspriceaction.com/viewforum.php?f=1&topicdays=0&start=${i}`,
			)
		}
		const analysisPosts = await getAnalysisPostsForPage(page)
		for (const post of analysisPosts) {
			const [, , , url, dateString] = post
			console.log(url, dateString)
			const [yearString, monthString, dayString] = dateString.split('-')
			if (!db.data.posts[yearString]) {
				db.data.posts[yearString] = {}
				await db.write()
			}
			if (!db.data.posts[yearString][monthString]) {
				db.data.posts[yearString][monthString] = []
				await db.write()
			}
			db.data.posts[yearString][monthString].push({
				url,
				dateString,
			})
			await db.write()
		}
		// const [title, author, numReplies, url, dateString] = analysisPosts
	}
}

async function getPostsForMonth(page, year, month) {
	await db.read()
	// if current month, scrape 1st page, redownload CSVs
	const currentMonth = new Date().getMonth() + 1
	const monthIsCurrentMonth = currentMonth === month
	// if CSV not saved already, fetch it
	if (monthIsCurrentMonth) {
		await signIn(page)
		process.stdout.write(
			'Scraping page 1 because searching for current month...',
		)
		await scrapeAllPages(page, true)
		console.log('pages scraped')
		const posts = db.data.posts[year][month]
		await savePostsToCSVs(page, posts)
		console.log('posts saved')
	} else if (db.data.monthSavedAsCSV.includes(year + '-' + month)) {
		// open folder
		console.log('csv files already exist... opening')
	} else {
		await signIn(page)
		const posts = db.data.posts[year][month]
		await savePostsToCSVs(page, posts)
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

async function scrape() {
	const [year, month] = await parseInput()
	const [browser, page] = await setUpPuppeteer()
	const scraping = false
	if (scraping) {
		await scrapeAllPages(page)
	}

	await getPostsForMonth(page, year, month)
	browser.close()
}

scrape()
