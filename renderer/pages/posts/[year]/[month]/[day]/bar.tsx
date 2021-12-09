import React, { useEffect, useRef, useState } from 'react'
import { addLeadingZeroes, getDatabase } from '../../../../../components'

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
		const pathToDatabaseFile = path.join(
			process.cwd(),
			'renderer',
			'public',
			'data',
			'price-action',
			'html',
			`${year}-${month}`,
		)
		console.log(pathToDatabaseFile)
		const db = await getDatabase(pathToDatabaseFile, {}, true)
		console.log(day, db.data)
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
				}
				body {
					background: rgba(0, 0, 0, 0.6);
					flex-grow: 1;
				}
				main {
					width: 100%;
					color: white;
					font-family: sans-serif;
					margin: auto;
					display: flex;
					width: 100%;
					padding: 2em;
					box-sizing: border-box;
					align-items: center;
				}
			`}</style>
		</React.Fragment>
	)
}

export default BarByBar
