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
		width: 1400,
		height: 1000,
	})

	if (isProd) {
		await mainWindow.loadURL('app://./home.html')
	} else {
		const port = process.argv[2]
		await mainWindow.loadURL(
			`http://localhost:${port}/home?bar-by-bar&year=2021`,
		)
		if (process.argv[2] === '--production') {
			mainWindow.webContents.openDevTools()
		}
	}
})()

async function createBarByBarWindow(year, month, day) {
	const barByBarWindow = createWindow('main2', {
		height: 115,
		width: 860,
		backgroundColor: '#00FFFFFF',
		transparent: true,
		frame: false,
		alwaysOnTop: true,

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
	const barByBarUrlParams = `?bar-by-bar&year=${year}&month=${month}&day=${day}`
	if (isProd) {
		await barByBarWindow.loadURL(`app://./home.html${barByBarUrlParams}`)
	} else {
		const port = process.argv[2]
		await barByBarWindow.loadURL(
			`http://localhost:${port}/home${barByBarUrlParams}`,
		)
		if (process.argv[2] === '--production') {
			barByBarWindow.webContents.openDevTools()
		}
	}
	return barByBarWindow
}
let barByBarWindow

function closeBarByBarWindow() {
	console.log('close-bar-by-bar-window')
	if (barByBarWindow) {
		try {
			barByBarWindow.close()
		} catch (error) {
			if (/^TypeError: Object has been destroyed/.test(error)) {
				// window already closed
			}
		}
	}
}
// Attach listener in the main process with the given ID
ipcMain.on('create-bar-by-bar-window', async (event, { year, month, day }) => {
	closeBarByBarWindow()
	barByBarWindow = await createBarByBarWindow(year, month, day)
})

ipcMain.on('close-bar-by-bar-window', () => {
	closeBarByBarWindow()
})

ipcMain.handle('get-database', async (event, { pathToDatabase }) => {
	const db = await getDatabase(pathToDatabase)
	return db
})

ipcMain.handle('get-days-for-month', async (event, { year, month }) => {
	const pathToDb = path.join('trading-course', 'html', `${year}-${month}`)
	const db = await getDatabase(pathToDb)
	if (db) {
		const days = Object.keys(db.data)

		return days
	} else return []
})

ipcMain.handle('get-path-to-file', async (event, { pathFromDataFolder }) => {
	const filePath = path.join(pathToDataFolder, pathFromDataFolder)

	if (fs.existsSync(filePath)) {
		return filePath
	} else return null
})

ipcMain.handle('check-file-exists', async (event, { filePath }) => {
	const fullPath = path.join(pathToDataFolder, filePath)

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

	return monthsAvailable
})

ipcMain.handle('get-path-to-image', async (event, { pathFromDataFolder }) => {
	const filePath = path.join(pathToDataFolder, pathFromDataFolder)

	if (fs.existsSync(filePath)) {
		return path.join('/', pathFromDataFolder)
	} else return null
})

app.on('window-all-closed', () => {
	app.quit()
})
