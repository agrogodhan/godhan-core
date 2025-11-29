// import { Queue } from "bullmq";
// import Redis from 'ioredis';
// import logger from '../utils/logger.js';

// const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
// const notificationQueue = new Queue('notificationQueue', { connection });

// async function enqueueNotification(type, payload) {
//   await notificationQueue.add(type, payload, {
//     attempts: 5,
//     backoff: { type: 'exponential', delay: 60000 },
//     removeOnComplete: true,
//     removeOnFail: false
//   });
//   logger.info(`[queue] enqueued ${type} -> ${payload.to}`);
// }

// export { notificationQueue, enqueueNotification };