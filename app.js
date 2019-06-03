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

app.use('/bots', require('./routers/bots')); // basic restful interface for testing by example

app.use((err, req, res) => res.status(500).send({ message: (err && err.message) ? err.message : 'Unknown' }));

module.exports = app;
