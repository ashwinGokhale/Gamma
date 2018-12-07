"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, label, printf } = winston_1.format;
const myFormat = printf(info => {
    return info.message;
});
exports.logger = winston_1.createLogger({
    format: combine(winston_1.format.splat(), myFormat),
    transports: [new winston_1.transports.Console()],
    levels: winston_1.config.cli.levels,
    silent: !!process.env.SILENT
});
//# sourceMappingURL=logger.js.map