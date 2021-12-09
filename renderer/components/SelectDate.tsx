import { useEffect, useState } from 'react'

import fs from 'fs'
import { getDatabase } from './'
import path from 'path'

function Select({
	options,
	name,
	setSelectedValue,
	selectedValue,
	monthNames = undefined,
}) {
	function handleSelection(option) {
		if (!option) return

		if (name === 'year') {
			setSelectedValue(() => ({
				year: option,
			}))
		} else if (name === 'month') {
			const monthNumber =
				monthNames.findIndex((monthName) => monthName === option) + 1

			setSelectedValue(({ year }) => ({
				year,
				month: monthNumber,
				day: undefined,
			}))
		} else {
			// name === 'day'
			setSelectedValue(({ year, month }) => ({
				year,
				month,
				day: option,
			}))
		}
	}
	function isChecked(option) {
		if (monthNames) {
			return option === monthNames[selectedValue.month - 1]
		} else return option === selectedValue[name]
	}

	return (
		<fieldset
			style={{
				display: 'inline-flex',
				flexDirection: 'column',
				border: 'none',
				margin: 0,
				padding: 0,
			}}
		>
			{!options || options.length === 0
				? 'Loading...'
				: options.map((option, i) => (
						<label
							key={i}
							style={{
								fontFamily: 'sans-serif',
								// background: '#eee',
								padding: '.3em .6em',
							}}
						>
							<input
								checked={isChecked(option)}
								type='radio'
								name={name}
								onChange={() => handleSelection(option)}
							/>{' '}
							{option}
						</label>
				  ))}
		</fieldset>
	)
}

function SelectMonth({
	setSelectedValue,
	selectedValue,
	monthsAvailableForYear,
}) {
	const monthNames = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec',
	]
	if (monthsAvailableForYear) {
		const monthOptions = monthsAvailableForYear.map(
			(monthNumber) => monthNames[monthNumber - 1],
		)
		return (
			<Select
				name='month'
				options={monthOptions}
				setSelectedValue={setSelectedValue}
				selectedValue={selectedValue}
				monthNames={monthNames}
			></Select>
		)
	} else return <div>loading months</div>
}
export function SelectDate({
	setSelectedValue,
	selectedValue,
	monthsAvailable,
	setPostNotFound,
}) {
	const [daysForMonth, setDaysForMonth] = useState([])
	const [loading, setLoading] = useState(true)
	async function getDaysForSelectedMonth() {
		const { month, year } = selectedValue
		const pathToDb = path.join(
			process.cwd(),
			'renderer',
			'public',
			'data',
			'trading-course',
			'html',
			`${year}-${month}`,
		)
		const fileExists = fs.existsSync(pathToDb + '.json')

		let days = []
		if (fileExists) {
			const db = await getDatabase(pathToDb, {}, true)
			days = Object.keys(db.data)
			setDaysForMonth(days)
		}
		return days
	}
	const [monthsAvailableForYear, setMonthsAvailableForYear] = useState()
	useEffect(() => {
		if (selectedValue.year) {
			setMonthsAvailableForYear(monthsAvailable[selectedValue.year])
			setLoading(false)
			if (selectedValue.month) {
				getDaysForSelectedMonth().then((days) => {
					if (selectedValue.day && !days.includes(selectedValue.day)) {
						console.log(selectedValue.day, 'doesnt exist in', days)
						setPostNotFound(true)
					} else setPostNotFound(false)
				})
			}
		} else setPostNotFound(false)
	}, [selectedValue])

	const yearsAvailable = Object.keys(monthsAvailable).sort(
		(a, b) => Number(b) - Number(a),
	)

	return loading ? (
		<div>loading...</div>
	) : (
		<div id='select' style={{ display: 'flex', width: '15em' }}>
			<Select
				name='year'
				options={yearsAvailable}
				setSelectedValue={setSelectedValue}
				selectedValue={selectedValue}
			></Select>
			{selectedValue.year && (
				<SelectMonth
					setSelectedValue={setSelectedValue}
					selectedValue={selectedValue}
					monthsAvailableForYear={monthsAvailableForYear}
				/>
			)}
			{selectedValue.year && selectedValue.month && (
				<Select
					name='day'
					options={daysForMonth}
					setSelectedValue={setSelectedValue}
					selectedValue={selectedValue}
				></Select>
			)}
		</div>
	)
}
