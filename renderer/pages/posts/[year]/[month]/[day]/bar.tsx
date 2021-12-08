import {
	PATH_TO_PRICE_ACTION_DATABASE_FILES,
	getDatabase,
} from '../../../../../components'
import React, { useEffect, useRef, useState } from 'react'

import Head from 'next/head'
import Nav from '../../../../nav'
import path from 'path'
import { useRouter } from 'next/dist/client/router'

function BarNavigator({ bars }) {
	const [selectedIndex, _setSelectedIndex] = useState(0)
	const selectedIndexRef = useRef(selectedIndex)
	const setSelectedIndex = (data) => {
		selectedIndexRef.current = data
		_setSelectedIndex(data)
	}
	const [bar, setBar] = useState(bars[selectedIndex])

	const selectNextIndex = () => {
		const i = selectedIndexRef.current
		setSelectedIndex(i === bars.length - 1 ? 0 : i + 1)
	}
	const selectPrevIndex = () => {
		const i = selectedIndexRef.current
		setSelectedIndex(i === 0 ? bars.length - 1 : i - 1)
	}

	useEffect(() => {
		setBar(bars[selectedIndex])
	}, [selectedIndex])

	const onKeyPress = (e) => {
		if (e.key === 'ArrowLeft') selectPrevIndex()
		if (e.key === 'ArrowRight') selectNextIndex()
	}

	useEffect(() => {
		addEventListener('keydown', onKeyPress)
		return () => {
			removeEventListener('keydown', onKeyPress)
		}
	}, [])

	return (
		<div>
			<button onClick={selectPrevIndex}>prev</button>
			<div id='number-and-description'>
				<div id='number'>{bar.barNumber}</div>
				<div id='description'>{bar.description}</div>
			</div>
			<button onClick={selectNextIndex}>next</button>
			<style jsx>{`
				display: flex;
				justify-content: space-between;
				font-size: 1em;
				gap: 1em;
				#number-and-description {
					flex-grow: 1;
					user-select: all;
				}
				#number {
					color: #999;
					margin-right: 1em;
				}
				#description {
					flex-grow: 1;
					line-height: 1.2;
				}
			`}</style>
		</div>
	)
}

function BarByBar() {
	const router = useRouter()
	const { year, month, day } = router.query
	const [imageForDay, setImageForDay] = useState(undefined)
	const [barsForDay, setBarsForDay] = useState(undefined)

	// TODO [] load file for date
	async function getBarData() {
		const pathToDatabaseFile = path.join(
			'..',
			PATH_TO_PRICE_ACTION_DATABASE_FILES,
			'html',
			`${year}-${month}`,
		)
		const pathToImageFile = path.join(
			'..',
			PATH_TO_PRICE_ACTION_DATABASE_FILES,
			'images',
			`${year}-${month}-${day}.png`,
		)
		const db = await getDatabase(pathToDatabaseFile)
		const bars = db.data[day]
		const imagePath = db.data[day]
		setBarsForDay(bars)
		// setImageForDay(imagePath)
	}
	useEffect(() => {
		// getFileForDate().then(db => )
		getBarData()
	}, [year, month, day])
	useEffect(() => {
		// getFileForDate().then(db => )
		console.log(barsForDay)
	}, [barsForDay])
	// TODO [] get image, show in main window
	// TODO [] bar-by-bar window:
	// TODO [] 	show line and arrows
	// TODO [] 	arrow-key navigation

	return (
		<React.Fragment>
			<Head>
				<title>
					{year}/{month}/{day}
				</title>
			</Head>
			<main>
				{barsForDay && barsForDay.length > 0 && (
					<BarNavigator bars={barsForDay} />
				)}
			</main>
			<style jsx global>{`
				html {
					-webkit-app-region: drag;
					user-select: none;
					height: 100%;
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
				}
				body {
					background: rgba(0, 0, 0, 0.6);
				}
				main {
					color: white;
					font-family: sans-serif;
					margin: 4em auto;
					max-width: 60em;
				}
			`}</style>
		</React.Fragment>
	)
}

export default BarByBar
