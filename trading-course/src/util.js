export function areNumbers() {
	const args = Array.prototype.slice.call(arguments)
	return args.every((v) => typeof Number(v) === 'number' || !v)
}
