const winston = require('winston');

const alignColorsAndTime = winston.format.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.label({
    label: '[LOGGER]',
  }),
  winston.format.timestamp({
    format: 'YY-MM-DD HH:MM:SS',
  }),
  winston.format.printf(
    info => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`,
  ),
);

const logger = winston.createLogger({
  level: 'silly',
  transports: [
    new (winston.transports.Console)({
      format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
    }),
  ],
});

function getLogger() {
  return logger;
}


module.exports = logger;
