import { ipcRenderer } from 'electron'
export const addLeadingZeroes = (n) => n.replace(/(^\d{1}$)/, '0$&')
export async function createBarByBarWindow(options) {
	ipcRenderer.send('create-bar-by-bar-window', options)
}

export async function closeBarByBarWindow() {
	ipcRenderer.send('close-bar-by-bar-window')
}
