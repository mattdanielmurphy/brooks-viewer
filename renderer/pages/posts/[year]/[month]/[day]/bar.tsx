import React, { useEffect, useRef, useState } from 'react'

import Head from 'next/head'
import { ipcRenderer } from 'electron'
import path from 'path'
import { useRouter } from 'next/dist/client/router'

function BarNavigator({ bars }) {
	const [selectedIndex, _setSelectedIndex] = useState(0)
	const [selectedBarNumber, _setSelectedBarNumber] = useState(1)
	const selectedIndexRef = useRef(selectedIndex)
	const selectedBarNumberRef = useRef(selectedBarNumber)
	const lastBar = +bars[bars.length - 1].barNumber
	const lastIndex = bars.length - 1

	const barsWithGaps = {}
	bars.forEach((bar) => (barsWithGaps[bar.barNumber - 1] = bar))
	for (let i = 0; i < lastBar; i++) {
		if (!barsWithGaps[i])
			barsWithGaps[i] = { description: '-', barNumber: i + 1 }
	}

	const setSelectedBarNumber = (data) => {
		selectedBarNumberRef.current = data
		_setSelectedBarNumber(data)
	}

	const setSelectedIndex = (data) => {
		selectedIndexRef.current = data
		_setSelectedIndex(data)
	}
	const [bar, setBar] = useState(barsWithGaps[selectedBarNumber])

	const selectNextIndex = () => {
		const selectedIndex = selectedIndexRef.current

		const newSelectedIndex = selectedIndex === lastIndex ? 0 : selectedIndex + 1
		setSelectedIndex(newSelectedIndex)
		return newSelectedIndex
	}
	const selectNextMeaningfulIndex = () => {
		const newSelectedIndex = selectNextIndex()
		if (barsWithGaps[newSelectedIndex].description === '-')
			return selectNextMeaningfulIndex()
	}
	const selectPrevIndex = () => {
		const selectedIndex = selectedIndexRef.current
		const newSelectedIndex = selectedIndex === 0 ? lastIndex : selectedIndex - 1
		setSelectedIndex(newSelectedIndex)
		return newSelectedIndex
	}
	const selectPrevMeaningfulIndex = () => {
		const newSelectedIndex = selectPrevIndex()
		if (barsWithGaps[newSelectedIndex].description === '-')
			return selectPrevMeaningfulIndex()
	}

	useEffect(() => {
		setBar(barsWithGaps[selectedIndex])
	}, [selectedIndex])

	const onKeyPress = (e) => {
		console.log('keypress bar-by-bar viewer')
		if (e.key === 'ArrowLeft') {
			if (e.shiftKey) selectPrevMeaningfulIndex()
			else selectPrevIndex()
		}
		if (e.key === 'ArrowRight') {
			if (e.shiftKey) selectNextMeaningfulIndex()
			else selectNextIndex()
		}
	}

	useEffect(() => {
		addEventListener('keydown', onKeyPress)
		return () => {
			removeEventListener('keydown', onKeyPress)
		}
	}, [])

	return (
		<div>
			<button onClick={selectPrevIndex} id='prev'>
				&#10140;
			</button>
			<div id='number-and-description'>
				<div id='number'>{bar.barNumber}</div>
				<div id='description'>{bar.description}</div>
			</div>
			<button onClick={selectNextIndex}>&#10140;</button>
			<style jsx>{`
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				font-size: 1em;
				gap: 2em;
				#number-and-description {
					flex-grow: 1;
					gap: 1em;
				}
				#number {
					color: #ffff80;
					margin-right: 1em;
					width: 0.5em;
				}
				#description {
					flex-grow: 1;
					line-height: 1.2;
				}
				button {
					width: 2.4em;
					background: none;
					height: 2em;
					color: #ccc;
					padding: 0.4em 0.7em 0.4em 0.7em;
					user-select: default;
				}
				button:hover {
					color: #0069ed;
				}
				button:focus {
					outline-offset: -2px;
					background: #555;
				}
				#prev {
					transform: scale(-1, 1);
				}
			`}</style>
		</div>
	)
}

function BarByBar() {
	const router = useRouter()
	let { year, month, day } = router.query
	const [imageForDay, setImageForDay] = useState()
	const [barsForDay, setBarsForDay] = useState([])

	// TODO [] load file for date
	async function getBarData() {
		const pathToDatabase = path.join(
			'price-action',
			'data',
			'html',
			`${year}-${month}`,
		)
		console.log('path to db', pathToDatabase)
		const db = await ipcRenderer.invoke('get-database', { pathToDatabase })
		if (typeof day === 'string') {
			const bars = db.data[day]
			setBarsForDay(bars)
		}
	}
	useEffect(() => {
		if (year && month && day) getBarData()
	}, [year, month, day])
	useEffect(() => {}, [barsForDay])

	return (
		<React.Fragment>
			<Head>
				<title>
					{year}/{month}/{day}
				</title>
			</Head>
			<main>{barsForDay.length > 0 && <BarNavigator bars={barsForDay} />}</main>
			<div id='help'>
				(Shift+Arrows to navigate through bar numbers <em>with descriptions</em>
				.)
			</div>
			<style jsx global>{`
				html {
					-webkit-app-region: drag;
					user-select: none;
					height: 100%;
					position: absolute;
					display: flex;
					align-items: center;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					font-family: -apple-system, BlinkMacSystemFont, sans-serif;
				}
				body {
					background: rgba(0, 0, 0, 0.6);
					flex-grow: 1;
				}
				main {
					width: 100%;
					color: white;
					margin: auto;
					display: flex;
					width: 100%;
					padding: 2em;
					box-sizing: border-box;
					align-items: center;
				}
				#help {
					font-size: 0.8em;
					color: #999;
					text-align: center;
				}
			`}</style>
		</React.Fragment>
	)
}

export default BarByBar
