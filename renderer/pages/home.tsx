import React, { useEffect } from 'react'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

function Home() {
	const router = useRouter()
	useEffect(() => {
		router.push('/posts/2021/1/4')
	}, [])
	return (
		<React.Fragment>
			<Head>
				<title>Home - Nextron (with-typescript)</title>
			</Head>
			<div>
				<p>
					<Link href='/posts/2021/10/4'>
						<a>Go to post</a>
					</Link>
				</p>
			</div>
		</React.Fragment>
	)
}

export default Home
