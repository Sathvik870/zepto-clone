const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const logDir = "logs";
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),

  new winston.transports.DailyRotateFile({
    level: "info",
    filename: path.join(logDir, "%DATE%-success.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "2d",
    format: winston.format.printf(
      (info) => `[${info.level.toUpperCase()}]: ${info.message}`
    ),
  }),

  new winston.transports.DailyRotateFile({
    level: "error",
    filename: path.join(logDir, "%DATE%-error.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "2d",
    format: winston.format.printf(
      (info) => `[${info.level.toUpperCase()}]: ${info.message}`
    ),
  }),
];

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.printf(
      (info) => `[${info.level.toUpperCase()}]: ${info.message}`
    )
  ),
  transports,
  exitOnError: false,
});

module.exports = logger;
