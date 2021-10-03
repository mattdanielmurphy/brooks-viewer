const cheerio = require('cheerio')
const axios = require('axios').default
const fs = require('fs').promises
const path = require('path')

async function fetchHtml(url) {
	const { data } = await axios.get(url)
	return cheerio.load(data)
}

async function writeLocalFile(pathName, content) {
	const saveDir = 'exports'
	await fs.rm(path.join(__dirname, saveDir, pathName)).catch(() => {})
	fs.writeFile(path.join(__dirname, saveDir, pathName), content)
}

function removeInlineColorInitial(htmlContent) {
	return htmlContent.replace('color: initial;', '')
}

function wrapHtml(htmlContent, title = 'Document') {
	htmlContent = removeInlineColorInitial(htmlContent)
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>${title}</title>
		<style rel="stylesheet" type="text/css">
			body {
				font-family: 'Calibri', sans-serif;
				max-width: 50rem;
				margin: 5rem auto;
			}
			@media (prefers-color-scheme: dark) { 
				body { background: #222; color: #eee; }
			}
		</style></head>
		<body>${htmlContent}</body></html>`
}

module.exports = { fetchHtml, writeLocalFile, wrapHtml }
