const { initDB } = require("./db/connection");
const { createAuthMiddleware } = require("./middlewares/auth");
const { initConfig, getConfig } = require("./utils/config");
const { successResponse, errorResponse } = require("./utils/response");
const { sendSMS } = require("./utils/sendSMS");
// const { sendEmail } = require("./utils/sendEmail");
const { createS3Util } = require("./utils/s3Utils");

module.exports = {
  initDB,
  createAuthMiddleware,
  initConfig,
  getConfig,
  successResponse,
  errorResponse,
  sendSMS,
  // sendEmail,
  createS3Util,
};