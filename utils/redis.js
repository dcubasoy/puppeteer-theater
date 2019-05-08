const Redis = require('ioredis');

module.exports = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379');
