import { JSONFile, Low } from 'lowdb'

import { default as axios } from 'axios'
import cheerio from 'cheerio'
import { promises as fs } from 'fs'
import path from 'path'
import { title } from 'process'

// * HTML

export async function fetchHtml(url) {
	// console.log('\nfetching url: ' + url + '\n')
	const { data } = await axios.get(url).catch((err) => {})
	return cheerio.load(data)
}

export function removeInlineColorInitial(htmlContent) {
	return htmlContent.replace('color: initial;', '')
}

export function wrapHtml(
	htmlContent,
	options = { title: 'Document', wrapWithBodyTag: true },
) {
	const { title, wrapWithBodyTag } = options
	htmlContent = removeInlineColorInitial(htmlContent)
	const body = wrapWithBodyTag ? `<body>${htmlContent}</body>` : htmlContent
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${title}</title>
		<style rel="stylesheet" type="text/css">
			body {
				font-family: 'Calibri', sans-serif;
				max-width: 40rem;
				margin: 4vw auto;
				padding: 2rem;
			}
			@media (prefers-color-scheme: dark) { 
				body { background: #222; color: #eee; }
				a { color: skyblue; text-decoration: none; }
				a:visited { color: orchid}
			}
			li {
				margin-bottom: .3rem;
			}
			img {
				max-width: 100%;
			}
		</style></head>
		${body}</html>`
}

// * FILESYSTEM (WRITING FILES & CREATING FOLDERS)

export async function writeLocalFile(pathName, content) {
	await fs.rm(path.join(__dirname, pathName)).catch(() => {})
	return await fs.writeFile(path.join(__dirname, pathName), content)
}

export async function makeLocalFolder() {
	const pathToFolder = [].slice.call(arguments)
	const completePath = path.join(__dirname, ...pathToFolder)
	return await fs.mkdir(completePath, { recursive: true }).catch(() => {})
}

// * TEXT MANIPULATION

export function shortenString(string, length) {
	if (string.length > length) {
		return string.substring(0, length - 3) + '...'
	} else return string
}

export function monthToNumber(month) {
	return new Date(Date.parse(month + ' 1, 2012')).getMonth() + 1
}

export async function getDateFromTime(time) {
	const [monthString, day, year] = await time
		.first()
		.text()
		.split(/\s|,\s?/)

	return [year, monthToNumber(monthString), day, monthString]
}

export async function cooldown(maxTime = 3000) {
	return new Promise(function (resolve) {
		setTimeout(() => resolve(), 400 + Math.random() * maxTime)
	})
}

export const getDatabase = async (pathToDatabaseFile, defaultData = {}) => {
	const filePath = path.join(__dirname, 'data', `${pathToDatabaseFile}.json`)
	const adapter = new JSONFile(filePath)
	const db = new Low(adapter)
	await db.read()
	if (!db.data) {
		console.log('creating new db', pathToDatabaseFile)
		db.data = defaultData
		db.write()
	}
	return db
}

export async function logToDatabase(data) {
	const logDb = await getDatabase('log', {})
	logDb.data[Date.now()] = [data]
	await logDb.write()
}
export async function clearLog() {
	const logDb = await getDatabase('log', {})
	logDb.data = {}
	await logDb.write()
}

export function length(obj) {
	// return length of object
	if (obj.length) return obj.length
	else return Object.keys(obj).length
}
