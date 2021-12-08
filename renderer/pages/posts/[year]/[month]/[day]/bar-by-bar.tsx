import React, { useEffect, useRef, useState } from 'react'

import Head from 'next/head'
import Nav from '../../../../nav'
import { useRouter } from 'next/dist/client/router'

function BarByBar() {
	const router = useRouter()
	const { year, month, day } = router.query

	// * HANDLE WINDOW DRAGGING
	const [initialCursorPos, _setInitialCursorPos] = useState({
		x: undefined,
		y: undefined,
	})
	const initialCursorPosRef = useRef(initialCursorPos)
	const setInitialCursorPos = (data) => {
		initialCursorPosRef.current = data
		_setInitialCursorPos(data)
	}
	return (
		<React.Fragment>
			<Head>
				<title>
					{year}/{month}/{day}
				</title>
			</Head>
			<main>
				<h1>Bar by bar</h1>
				<h2>
					{year} {month} {day}
				</h2>
				<div></div>
			</main>
			<style jsx global>{`
				html {
					-webkit-app-region: drag;
				}
				body {
					background: rgba(255, 255, 255, 0.2);
				}
				main {
					margin: 4em auto;
					max-width: 60em;
					// display: flex;
				}
			`}</style>
		</React.Fragment>
	)
}

export default BarByBar
