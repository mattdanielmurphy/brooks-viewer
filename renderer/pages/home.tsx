import React, { useEffect } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

function Home() {
	const router = useRouter()
	useEffect(() => {
		const matches = router.asPath.match(
			/\?bar-by-bar&year=(\d{4})&month=(\d{1,2})&day=(\d{1,2})/,
		)
		console.log(matches)
		if (matches) {
			const [, year, month, day] = matches
			router.push(`/posts/${year}/${month}/${day}/bar`)
		} else {
			router.replace('/posts/2021/1/4')
		}
	}, [])

	return (
		<React.Fragment>
			<Head>
				<title>Home - Nextron (with-typescript)</title>
			</Head>
			<div>
				<h1>Loading...</h1>
			</div>
			<style jsx>{`
				div {
					display: flex;
					align-items: center;
					justify-items: center;
					text-align: center;
				}
			`}</style>
		</React.Fragment>
	)
}

export default Home
