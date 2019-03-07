import { createLogger, format, transports, config } from 'winston';
const { combine, printf } = format;

const myFormat = printf(info => {
	return info.message;
});

export const logger = createLogger({
	format: combine(format.splat(), myFormat),
	transports: [new transports.Console()],
	levels: config.cli.levels,
	silent: process.env.NODE_ENV === 'test' ? true : process.env.SILENT ? true : !module.parent
});
