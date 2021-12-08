import {
	BarByBarButton,
	PATH_TO_TRADING_COURSE_DATABASE_FILES,
	getDatabase,
} from '../../../../components'
import React, { useEffect, useState } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import Nav from '../../../nav'
import fs from 'fs'
import path from 'path'
import { useRouter } from 'next/dist/client/router'

async function getPostText(year, month, day) {
	const pathToDb = path.join('html', `${year}-${month}`)
	const fullPathToDb = path.join(
		PATH_TO_TRADING_COURSE_DATABASE_FILES,
		pathToDb + '.json',
	)
	const fileExists = fs.existsSync(fullPathToDb)
	if (fileExists) {
		const db = await getDatabase(pathToDb)
		if (db.data[day]) {
			const postText = db.data[day][0].data[0]
			return postText
		} else return ''
	} else return ''
}

const styles = {
	fontFamily: 'sans-serif',
	padding: '2rem',
}

function PostContent({ year, month, day, postText }) {
	return (
		<div style={styles}>
			<BarByBarButton year={year} month={month} day={day} />
			<h1>
				Post {year}/{month}/{day}
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
		getPostText(year, month, day).then((text) => {
			const pathToImages = '/images'
			const fixedImagePathsText = text.replace(
				/src="([^"]*)"/g,
				`src="${pathToImages}/$1"`,
			)
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
