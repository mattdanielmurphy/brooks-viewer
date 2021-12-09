import React, { useEffect, useState } from 'react'

import { SelectDate } from '../components/SelectDate'
import fs from 'fs'
import { ipcRenderer } from 'electron'
import path from 'path'
import { pathToDataFolder } from '../components'
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
		ipcRenderer
			.invoke('get-months-available-for-trading-course')
			.then((monthsAvailable) => {
				console.log(monthsAvailable)
				setMonthsAvailable(monthsAvailable)
			})
		const { day, month, year } = selectedValue
		const url = `/posts/${year}/${month}/${day}`
		if (year && month && day) router.push(url)
	}, [selectedValue])
	return (
		<nav>
			{Object.keys(monthsAvailable).length > 0 && (
				<SelectDate
					monthsAvailable={monthsAvailable}
					setSelectedValue={setSelectedValue}
					selectedValue={selectedValue}
					setPostNotFound={setPostNotFound}
				></SelectDate>
			)}
		</nav>
	)
}

export default Nav
