#!/usr/bin/env node

import fsSync from 'fs'
import lowdb from 'lowdb'
import parseInput from './cli-options'
import path from 'path'
import puppeteer from 'puppeteer'
const fs = fsSync.promises
require('dotenv').config()

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
	await page.waitForSelector('input[name="username"]')
	await page.type('input[name="username"]', process.env.USERNAME)
	await page.type('input[name="password"]', process.env.PASSWORD)
	await Promise.all([
		// Wait for click that triggers navigation
		page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
		page.click('input[name="login"]'),
	])
	await page.waitForSelector('.maintitle')
}

async function getPostsForMonth(page, year, month) {
	// look at comments and author
	// it's a post if either of the following are true:
	// author=AlBrooks
	// author=BPAAdmin && Replies > 2 && title doesn't contain "No Webinar" or "Holiday"
	function authorIs(name) {}
	function titleDoesNotContain() {
		const args = [].slice.call(arguments)
		// see if this works: Array.from(arguments)
	}
	// const name = await page.$('.row3 .name')
	// const nameText = await name.evaluate((node) => node.firstChild.innerText)
	const nameElements = await page.evaluate('.row3 .name')
	// const authors = []

	// 2:
	// for (const el of nameElements) {
	// 	console.log(el)
	// 	const example_parent = (await el.$x('..'))[0]
	// 	const innerHtml = await example_parent.evaluate((node) => node.innerHtml)
	// 	console.log(innerHtml)
	// }

	if (
		authorIs('AlBrooks') ||
		(authorIs('BPAAdmin') && titleDoesNotContain('No Webinar', 'Holiday'))
	) {
	}
}

async function scrape() {
	const [year, month] = await parseInput()
	const [browser, page] = await setUpPuppeteer()

	await page.goto('https://www.brookspriceaction.com/viewforum.php?f=1')
	await signIn(page)
	console.log('sign in complete')
	await getPostsForMonth(page, year, month)
	browser.close()
}

scrape()
