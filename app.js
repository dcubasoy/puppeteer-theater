const tmp = require('tmp');

tmp.setGracefulCleanup();

const express = require('express');
const morgan = require('morgan');

const createLogger = require('./utils/logger');

const app = express();

const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-admin-secure.json');

const packagejson = require('./package.json');
const logger = createLogger('app');


admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: process.env.FIREBASE_URI });

admin.firestore().settings({ timestampsInSnapshots: true });

app.use(morgan('combined'));

app.use('/version', (req, res, next) => res.send(`${packagejson.name}@${packagejson.version}`));
app.get('/health-check', (req, res) => res.send('pong'));

app.use('/bots', require('./routers/bots'));


app.use((err, req, res, next) => {
  logger.error({ error: err, req, res });
  if (!(err instanceof Error)) return next(err);
  let code = parseInt(err.code || 500, 10);
  // eslint-disable-next-line no-restricted-globals
  if (!isFinite(code) || code < 100 || code > 999) {
    code = 500;
  }
  return res.status(code).send({ message: (err && err.message) ? err.message : 'Unknown' });
});

app.use((err, req, res, next) => {
  return res.status(500).send({ message: (err && err.message) ? err.message : 'Unknown' });
});

module.exports = app;
