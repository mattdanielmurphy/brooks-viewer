import { closeBarByBarWindow, createBarByBarWindow } from '../components'

import { useState } from 'react'

export function BarByBarButton({
	year,
	month,
	day,
	setShowingBarByBarImage,
	showingBarByBarImage,
}) {
	const url = `posts/${year}/${month}/${day}/bar`
	// ! REMOVE
	async function handleClick() {
		if (showingBarByBarImage) closeBarByBarWindow()
		else createBarByBarWindow({ url })

		setShowingBarByBarImage(!showingBarByBarImage)
	}
	// * TESTING:
	// useEffect(() => {
	// 	createBarByBarWindow({ url })
	// 	setShowingBarByBarImage(true)
	// }, [])
	return (
		<button onClick={handleClick}>
			{showingBarByBarImage ? 'Close' : 'Open'} bar-by-bar analysis
		</button>
	)
}
