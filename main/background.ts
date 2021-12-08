import * as remoteMain from '@electron/remote/main'

import { app } from 'electron'
import { createWindow } from './helpers'
import { ipcMain } from 'electron'
import serve from 'electron-serve'

// remoteMain.initialize()

const isProd: boolean = process.env.NODE_ENV === 'production'

let mainWindow

if (isProd) {
	serve({ directory: 'app' })
} else {
	app.setPath('userData', `${app.getPath('userData')} (development)`)
}

;(async () => {
	await app.whenReady()

	mainWindow = createWindow('main', {
		width: 1000,
		height: 600,
	})
	// remoteMain.enable(mainWindow.webContents)

	if (isProd) {
		await mainWindow.loadURL('app://./home.html')
	} else {
		const port = process.argv[2]
		await mainWindow.loadURL(`http://localhost:${port}/home`)
		// mainWindow.webContents.openDevTools()
	}
})()

// Attach listener in the main process with the given ID
ipcMain.on('create-window', async (event, { url = 'home' }) => {
	console.log('create window')
	const window = createWindow('main2', {
		height: 400,
		width: 600,
		backgroundColor: '#00FFFFFF',
		transparent: true,
		frame: false,
		// parent: mainWindow,

		webPreferences: {
			plugins: true,
			nodeIntegration: true,
			contextIsolation: false,
			backgroundThrottling: false,
			nativeWindowOpen: true,
			webSecurity: false,
		},
	})
	// window.loadURL('https://google.com')
	if (isProd) {
		await window.loadURL(`app://./${url}.html`)
	} else {
		const port = process.argv[2]
		await window.loadURL(`http://localhost:${port}/${url}`)
		// mainWindow.webContents.openDevTools()
	}
})

app.on('window-all-closed', () => {
	app.quit()
})
