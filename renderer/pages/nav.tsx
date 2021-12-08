import React, { useEffect, useState } from 'react'

import { PATH_TO_TRADING_COURSE_DATABASE_FILES } from '../components/constants'
import { SelectDate } from '../components/SelectDate'
import fs from 'fs'
import path from 'path'
import { useRouter } from 'next/router'

function Nav({ year, month, day, setPostNotFound }) {
	const router = useRouter()
	const [selectedValue, setSelectedValue] = useState({
		year,
		month,
		day,
	})
	const [monthsAvailable, setMonthsAvailable] = useState({})
	// get list of years and months available
	useEffect(() => {
		setSelectedValue({ year, month, day })
	}, [year, month, day])
	useEffect(() => {
		// read files to find out what years and months to display
		const pathToMonthsFiles = path.join(
			PATH_TO_TRADING_COURSE_DATABASE_FILES,
			'html',
		)
		fs.readdir(pathToMonthsFiles, (err, files) => {
			if (err) throw err
			interface MonthsAvailable {
				[year: number]: Array<string>
			}
			const monthsAvailable: MonthsAvailable = {}
			files.forEach((file) => {
				if (!file.match(/\d{4}-\d{1,2}\.json/)) return
				const [year, month] = file.split(/-|\./)
				if (!monthsAvailable[year]) monthsAvailable[year] = []
				monthsAvailable[year].push(month)
			})
			const sortedMonthsAvailable: MonthsAvailable = {}
			Object.entries(monthsAvailable).map(([year, months]) => {
				const monthsSorted = months.sort((a, b) => a - b)
				sortedMonthsAvailable[year] = monthsSorted
			})

			setMonthsAvailable(monthsAvailable)
		})
		const { day, month, year } = selectedValue
		const url = `/posts/${year}/${month}/${day}`
		if (year && month && day) router.push(url)
	}, [selectedValue])
	return (
		<nav>
			<SelectDate
				monthsAvailable={monthsAvailable}
				setSelectedValue={setSelectedValue}
				selectedValue={selectedValue}
				setPostNotFound={setPostNotFound}
			></SelectDate>
		</nav>
	)
}

export default Nav
