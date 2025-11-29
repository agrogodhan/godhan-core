import connectMongo from "./src/db/mongo.js";
import connectRedis from "./src/db/redis.js";
import response from "./src/http/response.js";
import errorHandler from "./src/http/errorHandler.js";
import apiClient from "./src/http/apiClient.js";
import asyncHandler from "./src/middlewares/asyncHandler.js";
import role from "./src/middlewares/role.js";
// import requestLogger from "./src/middlewares/requestLogger.js";
// import trace from "./src/middlewares/trace.js";
import validate from "./src/middlewares/validate.js";
import jwtUtils from "./src/security/jwt.js";
import hashUtils from "./src/security/hash.js";
import hmac from "./src/security/hmac.js";
import logger, { createAppLogger } from "./src/utils/logger.js";
import idGenerator from "./src/utils/idGenerator.js";
import dateUtils from "./src/utils/date.js";
import s3 from "./src/utils/s3Utils.js";
// import template from "./src/utils/template.service.js";
// import email from "./src/utils/email.js";
// import sms from "./src/utils/sms.js";
// import notifier from "./src/utils/notifier.js";
import metrics from "./src/utils/metrics.js";
// import tracing from "./src/utils/tracing.js";
import registry from "./src/utils/registry.js";
// import { initNotificationQueue } from "./queue/notificationQueue.js";
// import { initWorker } from "./queue/worker.js";


export default {
  db: {
    connectMongo,
    connectRedis,
  },
  http: {
    response,
    errorHandler,
    apiClient,
  },
  middleware: {
    asyncHandler,
    // auth,
    role,
    // requestLogger,
    // trace,
    validate,
  },
  // queue: {
  //   notificationQueue,
  //   worker,
  // },
  security: {
    jwt: jwtUtils,
    hashUtils,
    hmac,
  },
  utils: {
    logger,
    createAppLogger,
    idGenerator,
    dateUtils,
    s3,
    // template,
    // email,
    // sms,
    // notifier,
    metrics,
    // tracing,
    registry,
  },
};
