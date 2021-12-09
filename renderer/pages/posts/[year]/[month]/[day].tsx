import {
	BarByBarButton,
	addLeadingZeroes,
	closeBarByBarWindow,
	pathToDataFolder,
} from '../../../../components'
import React, { useEffect, useState } from 'react'

import Head from 'next/head'
import Nav from '../../../nav'
import cheerio from 'cheerio'
import fs from 'fs'
import { ipcRenderer } from 'electron'
import path from 'path'
import { useRouter } from 'next/dist/client/router'

async function getPostText(year, month, day) {
	const pathToDatabase = path.join('trading-course', 'html', `${year}-${month}`)
	const db =
		(await ipcRenderer.invoke('get-database', { pathToDatabase })) || {}
	if (db.data && db.data[day]) {
		const postText = db.data[day][0].data[0]
		return postText
	} else return ''
}

const styles = {
	fontFamily: 'sans-serif',
	padding: '2rem',
}

function PostContent({ year, month, day, postText }) {
	const [barByBarImageSource, setBarByBarImageSource] = useState('')
	const [showingBarByBarImage, setShowingBarByBarImage] = useState(false)
	function _closeBarByBarWindow() {
		setBarByBarImageSource('') // Reset
		setShowingBarByBarImage(false) // Reset
		closeBarByBarWindow()
	}

	useEffect(() => {
		if (year && month && day) {
			_closeBarByBarWindow()
			month = addLeadingZeroes(month)
			day = addLeadingZeroes(day)

			// change to execute on main process
			const pathToImage = path.join(
				'price-action',
				'images',
				`${year}-${month}-${day}.png`,
			)
			ipcRenderer
				.invoke('get-path-to-image', {
					pathFromDataFolder: pathToImage,
				})
				.then((pathToImage) => {
					if (pathToImage) setBarByBarImageSource(pathToImage)
				})
		}
	}, [year, month, day])

	return (
		<div style={styles}>
			{barByBarImageSource && (
				<p>
					<BarByBarButton
						year={year}
						month={month}
						day={day}
						setShowingBarByBarImage={setShowingBarByBarImage}
						showingBarByBarImage={showingBarByBarImage}
					/>
				</p>
			)}
			{showingBarByBarImage && <img src={barByBarImageSource} alt='' />}
			<h1>
				Emini &amp; Forex Trading Update {year}/{month}/{day}
			</h1>
			<div id='post-text' dangerouslySetInnerHTML={{ __html: postText }}></div>
		</div>
	)
}

function Post() {
	const router = useRouter()
	const { year, month, day } = router.query
	const [postText, setPostText] = useState('')
	const [postNotFound, setPostNotFound] = useState(false)
	useEffect(() => {
		if (!year || !month || !day) return
		getPostText(year, month, day).then((text) => {
			const pathToImages = '/images'
			let $ = cheerio.load(text)
			const filteredContent = []
			$('h2').each((i, el) => {
				const heading = $(el).text()

				// * REMOVE UNWANTED CONTENT BASED ON HEADING NAMES
				const sectionToBeRemoved =
					heading === 'Trading Room' ||
					heading.includes('EURUSD') ||
					heading.includes('Emini and Forex Trading Update')
				if (sectionToBeRemoved) return

				function getNext(elementsBelowH2) {
					const el = elementsBelowH2[elementsBelowH2.length - 1]
					if (!el.next || el.next.name === 'h2') {
						return elementsBelowH2
					} else {
						return getNext([...elementsBelowH2, el.next])
					}
				}

				// * RENAME HEADING NAMES
				if (heading.includes('Pre-Open')) $(el).text('Pre')
				if (heading.includes('Summary of today')) $(el).text('EOD Summary')

				if (i > 1) $(el).css('margin-top', '3em') // add space between sections at heading. don't put space above first heading... isn't i==0 because true first heading is removed anyway ("Emini and Forex Trading Update")

				// * to add links at the top to quickly navigate through headings
				$(el).attr('id', String(i))

				const elementsBelowH2 = getNext([el])
				elementsBelowH2.forEach((el) => {
					if (el.name === 'hr') return
					if (el.attribs.class === 'caption') return
					if ($(el).text().includes('I will update again')) return
					if ($(el).text().includes('See theweekly updatefor a discussion'))
						return
					filteredContent.push(el)
				})
			})
			text = filteredContent.map((el) => cheerio.html(el)).join('')
			// text = $(filteredContent).html()
			const fixedImagePathsText = text.replace(
				/src="([^"]*)"/g,
				`src="${pathToImages}/$1"`,
			)
			// .replace(
			// 	/src="([^"]*)"/g,
			// 	`src="${pathToImages}/$1"`,
			// )
			setPostText(fixedImagePathsText)
		})
	}, [router.query])
	return (
		<React.Fragment>
			<Head>
				<title>
					{year}/{month}/{day}
				</title>
			</Head>
			<main
				style={{
					display: 'flex',
					maxWidth: '60em',
					margin: '4em auto',
				}}
			>
				<Nav
					year={year}
					month={month}
					day={day}
					setPostNotFound={setPostNotFound}
				/>
				{postNotFound ? (
					<h1>Post not found</h1>
				) : (
					<PostContent
						postText={postText}
						year={year}
						month={month}
						day={day}
					/>
				)}
			</main>
		</React.Fragment>
	)
}

export default Post
