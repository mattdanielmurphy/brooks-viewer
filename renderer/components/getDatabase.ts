import { JSONFile, Low } from 'lowdb'

export async function getDatabase(
	pathToDatabaseFile,
	defaultData = {},
	fullPath = false,
) {
	let filePath = `${pathToDatabaseFile}.json`

	const adapter = new JSONFile(filePath)
	const db = new Low(adapter)
	await db.read()
	if (!db.data) {
		db.data = defaultData
		db.write()
	}
	return db
}
