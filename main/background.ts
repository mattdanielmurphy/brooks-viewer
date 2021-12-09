import * as remoteMain from '@electron/remote/main'

import { JSONFile, Low } from 'lowdb'

import { app } from 'electron'
import { createWindow } from './helpers'
import fs from 'fs'
import { ipcMain } from 'electron'
import path from 'path'
import serve from 'electron-serve'
import util from 'util'

const readdir = util.promisify(fs.readdir)

const pathToDataFolder = path.join(app.getPath('userData'), 'data')

const isProd = process.env.NODE_ENV === 'production'

async function getDatabase(pathToDatabaseFile, defaultData = {}) {
	let filePath = path.join(pathToDataFolder, `${pathToDatabaseFile}.json`)
	console.log('getting database', filePath)
	const fileExists = fs.existsSync(filePath)
	if (!fileExists) return

	const adapter = new JSONFile(filePath)
	const db = new Low(adapter)
	await db.read()
	if (!db.data) {
		db.data = defaultData
		db.write()
	}
	return db
}

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

ipcMain.handle('get-database', async (event, { pathToDatabase }) => {
	const db = await getDatabase(pathToDatabase)
	return db
})

ipcMain.handle('get-days-for-month', async (event, { year, month }) => {
	console.log('getting days for month')
	const pathToDb = path.join('trading-course', 'html', `${year}-${month}`)
	const db = await getDatabase(pathToDb)
	if (db) {
		const days = Object.keys(db.data)
		console.log(days)
		return days
	} else return []
})

ipcMain.on('working-path', async (event) => {
	event.reply('hello')
})

ipcMain.handle('get-path-to-file', async (event, { pathFromDataFolder }) => {
	const filePath = path.join(pathToDataFolder, pathFromDataFolder)
	console.log('getting path to file: ', filePath)
	if (fs.existsSync(filePath)) {
		console.log('file exists')
		return filePath
	} else return null
})

ipcMain.handle('check-file-exists', async (event, { filePath }) => {
	const fullPath = path.join(pathToDataFolder, filePath)
	console.log('getting path to file: ', fullPath)
	return fs.existsSync(fullPath)
})

ipcMain.handle('get-months-available-for-trading-course', async (event) => {
	const pathToMonthsFiles = path.join(
		pathToDataFolder,
		'trading-course',
		'html',
	)
	interface MonthsAvailable {
		[year: number]: Array<string>
	}
	const files = await readdir(pathToMonthsFiles)
	const monthsAvailable = {}
	files.forEach((file) => {
		if (!file.match(/\d{4}-\d{1,2}\.json/)) return
		const [year, month] = file.split(/-|\./)
		if (!monthsAvailable[year]) monthsAvailable[year] = []
		monthsAvailable[year].push(month)
	})
	const sortedMonthsAvailable: MonthsAvailable = {}
	Object.entries(monthsAvailable).map(([year, months]) => {
		const monthsSorted = months.sort((a, b) => a - b)
		sortedMonthsAvailable[year] = monthsSorted
	})
	console.log('monthsAvailable', monthsAvailable)
	return monthsAvailable
})

ipcMain.handle('get-path-to-image', async (event, { pathFromDataFolder }) => {
	const filePath = path.join(pathToDataFolder, pathFromDataFolder)
	console.log('getting path to file: ', filePath)
	if (fs.existsSync(filePath)) {
		console.log('image exists')
		return path.join('/', pathFromDataFolder)
	} else return null
})

app.on('window-all-closed', () => {
	app.quit()
})
