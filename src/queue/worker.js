// import Worker from 'bullmq';
// import Redis from 'ioredis';
// import logger from '../utils/logger.js';
// import email from '../utils/sendEmail.js';
// import sms from '../utils/sendSMS.js';

// const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// const worker = new Worker('notificationQueue', async job => {
//   const name = job.name;
//   const data = job.data;
//   logger.info(`[worker] processing ${name} -> ${data.to}`);
//   if (name === 'email') {
//     await email.sendEmail(data);
//   } else if (name === 'sms') {
//     await sms.sendSMS(data);
//   } else {
//     throw new Error('Unknown job name ' + name);
//   }
// }, { connection });

// worker.on('failed', (job, err) => logger.error('[worker] failed', job.id, err.message));
// worker.on('completed', job => logger.info('[worker] completed', job.id));

// export default worker;
