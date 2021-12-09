import { ipcRenderer } from 'electron'
import path from 'path'
export const addLeadingZeroes = (n) => n.replace(/(^\d{1}$)/, '0$&')
export async function createBarByBarWindow(options) {
	ipcRenderer.send('create-bar-by-bar-window', options)
}

export async function closeBarByBarWindow() {
	ipcRenderer.send('close-bar-by-bar-window')
}

const isProd = process.env.NODE_ENV === 'production'

export const pathToDataFolder = isProd
	? path.resolve(__dirname, '/data')
	: path.resolve('./', 'renderer', 'public', 'data')
