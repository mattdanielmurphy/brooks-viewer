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
		mainWindow.webContents.openDevTools()
	}
})()

async function createBarByBarWindow(url) {
	const barByBarWindow = createWindow('main2', {
		height: 115,
		width: 860,
		backgroundColor: '#00FFFFFF',
		transparent: true,
		frame: false,
		alwaysOnTop: true,
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
	// barByBarWindow.loadURL('https://google.com')
	if (isProd) {
		await barByBarWindow.loadURL(`app://./${url}.html`)
	} else {
		const port = process.argv[2]
		await barByBarWindow.loadURL(`http://localhost:${port}/${url}`)
		// barByBarWindow.webContents.openDevTools()
	}
	return barByBarWindow
}

let barByBarWindow

function closeBarByBarWindow() {
	if (barByBarWindow) {
		try {
			barByBarWindow.close()
		} catch (error) {
			if (/^TypeError: Object has been destroyed/.test(error)) {
				// window already closed
			} else console.log(error)
		}
	}
}
// Attach listener in the main process with the given ID
ipcMain.on('create-bar-by-bar-window', async (event, { url = 'home' }) => {
	closeBarByBarWindow()
	barByBarWindow = await createBarByBarWindow(url)
})
ipcMain.on('close-bar-by-bar-window', () => {
	closeBarByBarWindow()
})

app.on('window-all-closed', () => {
	app.quit()
})
