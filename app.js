const tmp = require('tmp');

tmp.setGracefulCleanup();

const morgan = require('morgan');
const express = require('express');

const packageJson = require('./package.json');

const app = express();

app.use(morgan('combined'));
app.get('/', async (req, res) => {
  res.status(200).send(`ping-${packageJson.name}@${packageJson.version}`);
});
app.use('/bots', require('./routers/bots'));


app.use((err, req, res, next) => {
  logger.error({ error: err, req, res });
  if (!(err instanceof Error)) return next(err);
  let code = parseInt(err.code || 500, 10);
  if (!Number.isFinite(code) || code < 100 || code > 999) {
    code = 500;
  }
  return res.status(code).send({ message: (err && err.message) ? err.message : 'Unknown' });
});

app.use((err, req, res, next) => res.status(500).send({ message: (err && err.message) ? err.message : 'Unknown' }));

module.exports = app;
