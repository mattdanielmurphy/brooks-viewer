// * creates CSV files from files in `data/html`
// new csv for every day

import { getDatabase, makeLocalFolder } from './utilities'

import { createObjectCsvWriter as createCsvWriter } from 'csv-writer'
import fs from 'fs/promises'
import path from 'path'

async function writeCsv(filePath, header, data) {
	const csvWriter = createCsvWriter({
		path: filePath,
		header,
	})

	data = data
		.map((datum) => {
			const description = datum.description.replace(/\r\n|\n/gm, ' ')
			const fixedDescription = description.replace(
				/For today’s real-time update, see <a(.*update<\/a>)?/s,
				'',
			)
			return {
				...datum,
				description: fixedDescription,
			}
		})
		.filter((datum) => datum.description && datum.description !== 'End of Day')

	return await csvWriter.writeRecords(data)
}

function getMonthName(monthNumber) {
	return [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	][monthNumber - 1]
}

async function convertJsonFileToCsv(jsonFile) {
	const nameSansExtension = path.basename(jsonFile, path.extname(jsonFile))
	const db = await getDatabase(path.join('json', nameSansExtension))
	const [year, month] = nameSansExtension.split('-')

	const monthDirPath = path.join(
		'data',
		'csv',
		year,
		month + ' - ' + getMonthName(month),
	)
	await makeLocalFolder(monthDirPath)

	const days = Object.entries(db.data)

	const csvHeader = [
		{ id: 'barNumber', title: 'BAR NUMBER' },
		{ id: 'description', title: 'DESCRIPTION' },
	]

	for (const [day, data] of days) {
		const csvFilePath = path.join(monthDirPath, day + '.csv')
		await writeCsv(csvFilePath, csvHeader, data)
	}
}

async function jsonToCsv() {
	await fs.rm('data/csv', { recursive: true })
	await makeLocalFolder('data/csv')
	const jsonFiles = await fs.readdir(path.join(process.cwd(), 'data/json'))

	jsonFiles.forEach(convertJsonFileToCsv)
}

jsonToCsv()
