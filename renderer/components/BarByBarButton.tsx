import * as remote from '@electron/remote'

function createBrowserWindow(options) {
	const { ipcRenderer } = require('electron')
	ipcRenderer.send('create-window', options)
	// const currentWindow = remote.BrowserWindow.getFocusedWindow
	// console.log(currentWindow)

	// const remoteMain = remote.require('@electron/remote/main')
	// remoteMain.enable(window.webContents)

	// window.loadURL('https://github.com')
}

export function BarByBarButton({ year, month, day }) {
	const url = `posts/${year}/${month}/${day}/bar-by-bar`
	function handleClick() {
		createBrowserWindow({ url })
	}
	return <button onClick={handleClick}>Open bar-by-bar analysis</button>
}
