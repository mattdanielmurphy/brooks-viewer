import { JSONFile, Low } from 'lowdb'

import { promises as fs } from 'fs'
import path from 'path'

export async function writeLocalFile(pathName, content) {
	const saveDir = 'exports'
	await fs.rm(path.join(__dirname, saveDir, pathName)).catch(() => {})
	return await fs.writeFile(path.join(__dirname, saveDir, pathName), content)
}

export async function makeLocalFolder() {
	const dirNames = [].slice.call(arguments)
	const dirPath = path.join(__dirname, '/..', ...dirNames)
	return await fs.mkdir(dirPath, { recursive: true }).catch(() => {})
}

export async function getDatabase(pathToDatabaseFile, defaultData = {}) {
	const filePath = path.join(
		process.cwd(),
		'data',
		`${pathToDatabaseFile}.json`,
	)
	const adapter = new JSONFile(filePath)
	const db = new Low(adapter)
	await db.read()
	if (!db.data) {
		console.log('creating new db', pathToDatabaseFile, defaultData)
		db.data = defaultData
		db.write()
	}
	return db
}

export async function logToDb(data) {
	const db = await getDatabase('log', {})
	db.data[Date.now()] = data
	db.write()
}
