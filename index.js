const { initDB } = require("./db/connection");
const { authMiddleware } = require("./middlewares/auth");
const { initConfig, getConfig } = require("./utils/config");
const { successResponse, errorResponse } = require("./utils/response");
const { sendSMS } = require("./utils/sendSMS");
const { sendEmail } = require("./utils/sendEmail");

module.exports = {
  initDB,
  authMiddleware,
  initConfig,
  getConfig,
  successResponse,
  errorResponse,
  sendSMS,
  sendEmail,
};