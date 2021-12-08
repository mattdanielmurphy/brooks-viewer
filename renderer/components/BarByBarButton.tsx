import * as remote from '@electron/remote'

function createBrowserWindow(options) {
	const { ipcRenderer } = require('electron')
	ipcRenderer.send('create-window', options)
}

export function BarByBarButton({ year, month, day }) {
	const url = `posts/${year}/${month}/${day}/bar`
	function handleClick() {
		createBrowserWindow({ url })
	}
	return <button onClick={handleClick}>Open bar-by-bar analysis</button>
}
