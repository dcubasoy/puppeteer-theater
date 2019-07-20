const winston = require('winston');

const colorizer = winston.format.colorize();

function createLogger(label) {
  if (!winston.loggers.has(label)) {
    winston.loggers.add(label, {
      transports: [new winston.transports.Console()],
      format: winston.format.combine(
        winston.format.label({ label }),
        winston.format.timestamp(),
        winston.format.prettyPrint({ depth: null }),
        winston.format.simple(),
        winston.format.printf(msg => colorizer.colorize(msg.level, `${msg.timestamp} - ${msg.level}: ${msg.message}`)),
      ),
    });
  }
  return winston.loggers.get(label);
}

module.exports = createLogger;
