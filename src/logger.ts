import { createLogger, format, transports, config } from 'winston';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(info => {
	return info.message;
});

export const logger = createLogger({
	format: combine(
		format.splat(),
		myFormat
		// format.simple()
	),
	transports: [new transports.Console()],
	levels: config.cli.levels,
	silent: !!process.env.SILENT
});
