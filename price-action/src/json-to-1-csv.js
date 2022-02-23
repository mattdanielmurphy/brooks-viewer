// * creates 1 CSV from files in `data/html`

import { createObjectCsvWriter as createCsvWriter } from 'csv-writer'
import fs from 'fs/promises'
import { getDatabase } from './utilities'
import path from 'path'

async function writeCsv(filePath, header, data) {
	const csvWriter = createCsvWriter({
		path: filePath,
		header,
	})

	return await csvWriter.writeRecords(data)
}

function fixDescriptionAndAddDate(data, dateString) {
	const dataWithFixedDescriptionAndDate = data.map((datum) => {
		const description = datum.description.replace(/\r\n|\n/gm, ' ')
		const fixedDescription = description.replace(
			/For today’s real-time update, see <a(.*update<\/a>)?/s,
			'',
		)
		return {
			date: dateString, //? Add a date string
			barNumber: +datum.barNumber,
			description: fixedDescription,
		}
	})

	return dataWithFixedDescriptionAndDate
}

function fillInGaps(data) {
	const lastNumber = +data[data.length - 1].barNumber
	const dataInPosition = Array(lastNumber).fill(0, 0)

	data.forEach((datum) => (dataInPosition[datum.barNumber - 1] = datum))

	function getNextDate(data) {
		if (data[0] && data[0].date) return data[0].date
		else return getNextDate(data.slice(1))
	}

	const gapsFilled = dataInPosition.map((datum, i) => {
		if (datum) return datum
		else {
			const prevDatum = dataInPosition[i - 1]
			let date
			if (prevDatum) {
				if (datum.barNumber < prevDatum.barNumber) {
					// new date, get next date
					date = getNextDate(dataInPosition.slice(i))
				} else date = prevDatum.date
			} else date = getNextDate(dataInPosition.slice(i))

			const gap = {
				date,
				barNumber: i + 1,
				description: '-',
			}
			return gap
		}
	})
	return gapsFilled
}

async function convertJsonTo1Csv(jsonFiles) {
	const csvHeader = [
		{ id: 'date', title: 'DATE' },
		{ id: 'barNumber', title: 'BAR NUMBER' },
		{ id: 'description', title: 'DESCRIPTION' },
	]

	const csvData = []

	for (const jsonFilename of jsonFiles) {
		const monthFilenameWithoutExtension = path.basename(
			jsonFilename,
			path.extname(jsonFilename),
		)
		const db = await getDatabase(
			path.join('json', monthFilenameWithoutExtension),
		)
		const [year, month] = monthFilenameWithoutExtension.split('-')
		const days = Object.entries(db.data)

		for (const [day, data] of days) {
			const dateString = `${year}-${month}-${day}`
			const transformedData = fixDescriptionAndAddDate(data, dateString)
			const dataWithGapsFilledIn = fillInGaps(transformedData)

			console.log(dataWithGapsFilledIn)
			csvData.push(...dataWithGapsFilledIn)
		}
	}

	writeCsv('data.csv', csvHeader, csvData)
}

async function jsonToCsv() {
	const jsonFiles = await fs.readdir(path.join(process.cwd(), 'data/json'))

	convertJsonTo1Csv(jsonFiles)
}

jsonToCsv()
