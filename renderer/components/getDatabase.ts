import { JSONFile, Low } from 'lowdb'

import { PATH_TO_DATABASE_FILES } from './constants'
import path from 'path'

export async function getDatabase(pathToDatabaseFile, defaultData = {}) {
	const filePath = path.join(
		PATH_TO_DATABASE_FILES,
		`${pathToDatabaseFile}.json`,
	)
	const adapter = new JSONFile(filePath)
	const db = new Low(adapter)
	await db.read()
	if (!db.data) {
		db.data = defaultData
		db.write()
	}
	return db
}
