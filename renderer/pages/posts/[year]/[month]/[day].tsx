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
import router, { useRouter } from 'next/dist/client/router'

async function getPostText(year, month, day) {
	const pathToDatabase = path.join('trading-course', 'html', `${year}-${month}`)
	const db =
		(await ipcRenderer.invoke('get-database', { pathToDatabase })) || {}
	if (db.data && db.data[day]) {
		const postText = db.data[day][0].data[0]
		return postText
	} else return ''
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
		ipcRenderer.on('close-bar-by-bar-window', (e) => {
			console.log('received close bar-by-bar window', e)
			_closeBarByBarWindow()
		})
	}, [])

	useEffect(() => {
		if (year && month && day) {
			_closeBarByBarWindow()

			// add leading zeroes for image path
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
		<div id='post-content'>
			<div
				style={{
					height: '2em',
				}}
			>
				{barByBarImageSource && (
					<>
						<BarByBarButton
							year={year}
							month={month}
							day={day}
							setShowingBarByBarImage={setShowingBarByBarImage}
							showingBarByBarImage={showingBarByBarImage}
						/>
						<button onClick={() => router.replace('#bar-by-bar-chart')}>
							Go to bar-by-bar image
						</button>
					</>
				)}
			</div>
			<h1>
				Emini &amp; Forex Trading Update {year}/{month}/{day}
			</h1>
			<div id='post-text' dangerouslySetInnerHTML={{ __html: postText }}></div>

			{barByBarImageSource && (
				<>
					<h1>Bar by bar chart</h1>
					<img src={barByBarImageSource} alt='' id='bar-by-bar-chart' />
					<BarByBarButton
						year={year}
						month={month}
						day={day}
						setShowingBarByBarImage={setShowingBarByBarImage}
						showingBarByBarImage={showingBarByBarImage}
					/>
				</>
			)}
			<style jsx global>{`
				#post-text li {
					margin-bottom: 0.6em;
				}
				#post-text {
					line-height: 1.2;
				}
				sup {
					margin-right: 0.2em;
					vertical-align: top;
					font-size: 0.7em;
				}
				h2,
				h3 {
					margin-top: 1.5em;
				}
				#post-content {
					font-family: sans-serif;
					padding: 0.5rem 2rem 2rem 2rem;
					margin-left: 15rem;
				}
			`}</style>
		</div>
	)
}

//? TEXT FORMATTING UTILITY
// tags like strong

function surroundTagsWithSpaces(text: string, tags: string[]) {
	tags.forEach((tag) => {
		text = text
			.replaceAll(`<${tag}>`, ` <${tag}>`)
			.replaceAll(`</${tag}>`, `</${tag}> `)
	})
	console.log(text)
	return text
}

function surroundInlineTagsWithSpaces(text: string) {
	return surroundTagsWithSpaces(text, ['strong', 'em'])
}

function Post() {
	const router = useRouter()
	const { year, month, day } = router.query
	const [postText, setPostText] = useState('')
	const [postNotFound, setPostNotFound] = useState(false)
	useEffect(() => {
		if (!year || !month || !day) return
		getPostText(year, month, day).then((text) => {
			const pathToImages = path.join('/', 'trading-course', 'images')
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

				// if (i > 1) $(el).css('margin-top', '3em') // add space between sections at heading. don't put space above first heading... isn't i==0 because true first heading is removed anyway ("Emini and Forex Trading Update")

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
			text = surroundInlineTagsWithSpaces(text)
			const imgSrcMatches = /src="([^"]*)"/g.exec(text)
			if (!imgSrcMatches) {
				console.log('no match for image src', text)
				setPostText(text)
			} else {
				const imageSrc = imgSrcMatches[1]
				const imagePath = path.join(
					process.cwd(),
					'renderer',
					'public',
					pathToImages,
					imageSrc,
				)

				if (fs.existsSync(imagePath)) {
					const fixedImagePathsText = text.replace(
						/src="([^"]*)"/g,
						`src="${pathToImages}/$1"`,
					)
					setPostText(fixedImagePathsText)
				} else {
					const fixedImagePathsText = text.replace(
						/<a href="([^"]*)"><img (?:loading="lazy")? src="([^"]*)"/g,
						`<a href="$1"><img src="$1"`,
					)

					setPostText(fixedImagePathsText)
				}
			}
		})
	}, [router.query])
	return (
		<React.Fragment>
			<Head>
				<title>
					{year}/{month}/{day}
				</title>
			</Head>
			<main>
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
			<style jsx global>{`
				body {
					display: flex;
					align-content: center;
					justify-content: center;
				}
				main {
					margin-top: 2em;
					max-width: 60em;
				}
			`}</style>
		</React.Fragment>
	)
}

export default Post
