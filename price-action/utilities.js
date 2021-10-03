const cheerio = require('cheerio')
const axios = require('axios')
const fs = require('fs').promises
const path = require('path')

async function fetchHtml(url) {
	// @ts-ignore
	const { data } = await axios.get(url)
	return cheerio.load(data)
}

async function writeLocalFile(pathName, content) {
	const saveDir = 'exports'
	await fs.rm(path.join(__dirname, saveDir, pathName)).catch(() => {})
	fs.writeFile(path.join(__dirname, saveDir, pathName), content)
}

module.exports = { fetchHtml, writeLocalFile }
