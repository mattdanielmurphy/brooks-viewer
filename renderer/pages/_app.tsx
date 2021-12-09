// import './day.css'

import App from 'next/app'

const CustomApp = (props) => (
	<>
		<App {...props} />
		<style jsx global>{`
			figure.wp-block-image.size-large {
				margin: 0;
			}

			img {
				width: 100%;
			}

			button {
				text-transform: lowercase;
				display: inline-block;
				border: none;
				padding: 0.45rem 0.8rem 0.5rem 0.8rem;
				border-radius: 0.3em;
				margin: 0;
				text-decoration: none;
				background: #0069ed;
				color: #ffffff;
				font-family: sans-serif;
				font-size: 1rem;
				cursor: pointer;
				text-align: center;
				transition: background 250ms ease-in-out, transform 150ms ease;
				-webkit-appearance: none;
				-moz-appearance: none;
			}

			button:hover,
			button:focus {
				background: #0053ba;
			}

			button:focus {
				outline: 1px solid #fff;
				outline-offset: -4px;
			}

			button:active {
				transform: scale(0.99);
			}
		`}</style>
	</>
)

export default CustomApp
