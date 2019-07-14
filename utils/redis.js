const Redis = require('ioredis');

// Optional: Redis for consumer queues (data => redis => consumer/worker => final source (Example: BigQuery)
module.exports = new Redis(process.env.REDIS_URI || 'redis://127.0.0.1:6379');
