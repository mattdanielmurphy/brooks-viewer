import './day.css'

import App from 'next/app'

export default (props) => (
	<>
		<App {...props} />
		<style jsx global>{`
			button {
				display: inline-block;
				border: none;
				padding: 1rem 2rem;
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
