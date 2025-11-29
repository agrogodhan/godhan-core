// // import email from './email.js';
// import sms from "./sms.js";
// import { enqueueNotification } from "../queue/notificationQueue.js";
// import logger from "./logger.js";

// async function notifyEmail(data) {
//   try {
//     // return await email.sendEmail(data);
//   } catch (err) {
//     logger.warn("[notifier] email failed, queueing", err.message);
//     await enqueueNotification("email", data);
//     return null;
//   }
// }

// async function notifySMS(data) {
//   try {
//     return await sms.sendSMS(data);
//   } catch (err) {
//     logger.warn("[notifier] sms failed, queueing", err.message);
//     await enqueueNotification("sms", data);
//     return null;
//   }
// }

// const notifier = { notifyEmail, notifySMS };

// export default notifier;
