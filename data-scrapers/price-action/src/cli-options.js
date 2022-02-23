import { program } from 'commander'

async function parseInput() {
	return await new Promise(function (resolve, reject) {
		program
			.version('0.0.1')
			.argument('<yyyy-mm>', 'month to scrape')
			.action((date) => {
				if (/\d{4}\-\d{1,2}/.test(date)) {
					const [year, month] = date.split('-').map((v) => Number(v))
					if (year < 2009 || (year === 2009 && month < 6)) {
						console.error(
							"Error: requested month is older than Brooks' forum posts.",
						)
						reject()
					} else {
						resolve([year, month])
					}
				} else {
					console.error(
						'Error: you did not provide a date string in the correct format: yyyy-mm',
					)
					reject()
				}
			})
			.showHelpAfterError()

		program.parse()
	})
}

export default parseInput
