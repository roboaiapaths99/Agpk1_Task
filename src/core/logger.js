const winston = require('winston');
const { config } = require('../config');

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

const { maskData } = require('./masker');

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format((info) => {
        return maskData(info);
    })(),
    config.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                let log = `${timestamp} [${level}]: ${message}`;
                if (stack) log += `\n${stack}`;
                if (Object.keys(meta).length > 0) log += ` ${JSON.stringify(meta)}`;
                return log;
            })
        )
);

const transports = [
    new winston.transports.Console(),
];

if (!config.isTest) {
    transports.push(
        new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }),
        new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 })
    );
}

const logger = winston.createLogger({
    level: config.logLevel || 'info',
    levels,
    format,
    transports,
    exitOnError: false,
});

module.exports = logger;
