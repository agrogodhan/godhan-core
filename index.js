// ── DB ──────────────────────────────────────────────────────────────────────
import mongoose        from 'mongoose';
import connectMongo    from './src/db/mongo.js';
import connectRedis    from './src/db/redis.js';

// ── HTTP ─────────────────────────────────────────────────────────────────────
import response        from './src/http/response.js';
import createErrorHandler from './src/http/errorHandler.js';
import createApiClient from './src/http/apiClient.js';

// ── Middleware ────────────────────────────────────────────────────────────────
import asyncHandler    from './src/middlewares/asyncHandler.js';
import createAuth      from './src/middlewares/auth.js';
import role            from './src/middlewares/role.js';
import createRequestLogger from './src/middlewares/requestLogger.js';
import trace           from './src/middlewares/trace.js';
import validate        from './src/middlewares/validate.js';

// ── Security ──────────────────────────────────────────────────────────────────
import jwt             from './src/security/jwt.js';
import hash            from './src/security/hash.js';
import hmac            from './src/security/hmac.js';

// ── Utils ─────────────────────────────────────────────────────────────────────
import logger, { createAppLogger } from './src/utils/logger.js';
import idGenerator     from './src/utils/idGenerator.js';
import date            from './src/utils/date.js';
import s3              from './src/utils/s3Utils.js';
import template        from './src/utils/template.service.js';
import email           from './src/utils/email.js';
import sms             from './src/utils/sms.js';
import notifier        from './src/utils/notifier.js';
import config          from './src/utils/config.js';
import metrics         from './src/utils/metrics.js';
import tracing         from './src/utils/tracing.js';
import registry        from './src/utils/registry.js';

// ── Default export ────────────────────────────────────────────────────────────
// Namespaced object for:  import core from '@godhan/core';
const core = {
  db: {
    connectMongo,
    connectRedis,
    // The SAME mongoose instance connectMongo connects — every service must define its models
    // against this one (`const mongoose = core.db.mongoose`), not its own `import mongoose from
    // "mongoose"`. Node resolves a service's own `mongoose` dependency to a physically separate
    // package copy from godhan-core's (different node_modules tree), which means a separate,
    // never-connected default connection registry — models defined against it hang forever on
    // any query ("buffering timed out") even though connectMongo logs a successful connection.
    mongoose,
  },
  http: {
    response,
    createErrorHandler,
    apiClient: createApiClient,
  },
  middleware: {
    asyncHandler,
    createAuth,
    role,
    createRequestLogger,
    trace,
    validate,
  },
  security: {
    jwt,
    hash,
    hmac,
  },
  utils: {
    logger,
    createAppLogger,
    idGenerator,
    date,
    s3,
    template,
    email,
    sms,
    notifier,
    config,
    metrics,
    tracing,
    registry,
  },
};

export default core;
