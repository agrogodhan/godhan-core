# godhan-core Service Analysis

> **Date:** 2026-05-08
> **Analyst:** Claude Sonnet 4.6

---

## What godhan-core Is

A **shared utility library** (not a standalone service) meant to be imported by other Godhan microservices. It provides infrastructure primitives they all need in common — database connectivity, HTTP helpers, security, logging, external integrations, and observability.

---

## Project Structure

```
godhan-core/
├── config/
│   └── db.js                        # MongoDB connection config
├── db/
│   └── connection.js                # Connection initialization helper
├── src/
│   ├── db/
│   │   ├── mongo.js                 # Mongoose connection with retry logic
│   │   └── redis.js                 # Redis client initialization
│   ├── http/
│   │   ├── response.js              # Unified HTTP response formatter
│   │   ├── errorHandler.js          # Express error handler middleware
│   │   └── apiClient.js             # Axios HTTP client with trace headers
│   ├── middlewares/
│   │   ├── asyncHandler.js          # Async/await error wrapper
│   │   ├── role.js                  # Role-based access control (RBAC)
│   │   ├── validate.js              # Request body validation (Joi)
│   │   ├── requestLogger.js         # HTTP request logging
│   │   └── trace.js                 # Distributed tracing (X-Trace-Id)
│   ├── security/
│   │   ├── jwt.js                   # JWT sign/verify utilities
│   │   ├── hash.js                  # Password hashing (bcrypt)
│   │   └── hmac.js                  # HMAC-SHA256 signature verification
│   ├── utils/
│   │   ├── logger.js                # Winston logging system
│   │   ├── idGenerator.js           # UUID generation
│   │   ├── date.js                  # IST timezone date utilities
│   │   ├── metrics.js               # Prometheus metrics (HTTP duration)
│   │   ├── s3Utils.js               # AWS S3 operations
│   │   ├── sms.js                   # Twilio SMS integration
│   │   ├── config.js                # MongoDB-backed config storage
│   │   ├── template.service.js      # Email template management (Handlebars)
│   │   ├── notifier.js              # Notification orchestrator (commented out)
│   │   ├── registry.js              # Service registry integration
│   │   └── tracing.js               # OpenTelemetry tracing setup
│   └── queue/
│       ├── notificationQueue.js     # BullMQ notification queue (commented out)
│       └── worker.js                # Queue job processor (commented out)
├── templates/
│   ├── welcome.hbs                  # Account welcome email template
│   └── resetpassword.hbs            # Password reset email template
├── index.js                          # Main export barrel file
├── package.json
└── README.md
```

---

## Functionality Implemented

### 1. Database Connectivity

**MongoDB** (`src/db/mongo.js`)
- Mongoose connection with configurable retry logic (default: 2s interval, 10 retries)
- Reconnect handlers: connected, error, disconnected, reconnected, reconnectFailed events

**Redis** (`src/db/redis.js`)
- ioredis client with graceful mock fallback when `REDIS_ENABLED=false`
- Connection event handlers

**Config Store** (`src/utils/config.js`)
- MongoDB-backed dynamic key-value configuration
- Type coercion: string / number / boolean
- `getConfig(key, default)` and `setConfig(key, value, type)` API

---

### 2. HTTP Layer

**Response Formatter** (`src/http/response.js`)
```javascript
response.success(res, data, message, statusCode)
response.error(res, data, message, statusCode)
```
- Unified JSON envelope: `{ success, message, data, status, timestamp }`

**Error Handler** (`src/http/errorHandler.js`)
- Express global error middleware
- Stack trace logging, double-response protection

**API Client** (`src/http/apiClient.js`)
- Axios wrapper with 10s timeout
- Automatic `X-Trace-Id` header injection for inter-service calls
- Optional Bearer token authorization

---

### 3. Middlewares

| Middleware | What It Does |
|---|---|
| `asyncHandler` | Wraps async route handlers, catches unhandled Promise rejections |
| `role` | RBAC — checks `req.user.role` against required role |
| `validate` | Joi schema validation on `req.body` |
| `requestLogger` | Logs method, URL, status, response time, traceId |
| `trace` | Extracts or generates `X-Trace-Id`, sets on `req.traceId` + response header |

---

### 4. Security

| Module | API |
|---|---|
| **JWT** (`src/security/jwt.js`) | `sign(payload, {secret}, opts)` / `verify(token, {secret})` |
| **bcrypt** (`src/security/hash.js`) | `hash(plaintext)` / `compare(plain, hash)` — salt rounds: 10 |
| **HMAC-SHA256** (`src/security/hmac.js`) | `verifySignature(payload, signature, secret)` for webhook/payment validation |

---

### 5. Utilities

| Utility | Features |
|---|---|
| **Logger** (Winston) | JSON/text formatting, configurable level via `LOG_LEVEL`, error stack traces |
| **Date Utils** | IST timezone-aware `now()`, `addDays()`, `format()` via moment-timezone |
| **ID Generator** | UUID v4 via `uuid` package |
| **Prometheus Metrics** | HTTP request duration histogram + `/metrics` endpoint exposure |
| **Service Registry** | `registerService(name, version, port, healthUrl)` via `CORE_REGISTRY_URL` |
| **OpenTelemetry Tracing** | OTLP HTTP exporter, optional console exporter via `TRACE_CONSOLE=true` |

---

### 6. External Integrations

**AWS S3** (`src/utils/s3Utils.js`)
```javascript
uploadToS3({ s3Client, bucket, key, buffer, contentType, acl })
getPresignedUrlUpload({ s3Client, bucket, key, contentType, expiresIn })
getPresignedUrlView({ s3Client, bucket, key, expiresIn })
deleteFromS3({ s3Client, bucket, key })
```
- Supports both AWS SDK v2 and v3 clients
- Mock mode for testing
- ACL support (default: `private`)

**Twilio SMS** (`src/utils/sms.js`)
```javascript
sendSms({ twilioClient, from, to, body })
sendOtp({ twilioClient, from, to, code, ttlMinutes })
```
- OTP message template with configurable TTL
- Mock mode if no client provided

**Email Templates** (`src/utils/template.service.js`)
- Dual-source template resolution:
  1. Local `.hbs` files: `templates/{channel}_{key}.hbs`
  2. MongoDB fallback (requires a Template model in the consuming service)
- Handlebars compilation with context injection

**Email Templates Available:**
| Template | Trigger | Variables |
|---|---|---|
| `welcome.hbs` | New account verification | `{{name}}`, `{{link}}`, `{{year}}` |
| `resetpassword.hbs` | Password reset request | `{{name}}`, `{{resetLink}}` |

---

### 7. Exported API (`index.js`)

```javascript
{
  db: { connectMongo, connectRedis },
  http: { response, errorHandler, apiClient },
  middleware: { asyncHandler, role, validate },
  security: {
    jwt: { sign, verify },
    hashUtils: { hash, compare },
    hmac: { verifySignature }
  },
  utils: {
    logger, createAppLogger,
    idGenerator: { uuid },
    dateUtils: { now, addDays, format },
    s3: { uploadToS3, getPresignedUrlUpload, getPresignedUrlView, deleteFromS3 },
    metrics: { observeRequest, exposeMetrics },
    registry: { registerService }
  }
}
```

---

### 8. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `REDIS_URL` | No | Redis connection URL |
| `REDIS_ENABLED` | No | Enable Redis (`true`/`false`, default: `false`) |
| `JWT_SECRET` | Yes | JWT signing secret |
| `AWS_ACCESS_KEY` | Yes (if using S3) | AWS credentials |
| `AWS_SECRET_KEY` | Yes (if using S3) | AWS credentials |
| `SMTP_HOST` | Yes (if using email) | Email server host |
| `SMTP_PORT` | Yes (if using email) | Email server port |
| `SMTP_SECURE` | No | TLS flag |
| `SMTP_USER` | Yes (if using email) | SMTP username |
| `SMTP_PASS` | Yes (if using email) | SMTP password |
| `CORE_REGISTRY_URL` | No | Service registry endpoint |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OpenTelemetry collector (default: `http://localhost:4318/v1/traces`) |
| `TRACE_CONSOLE` | No | Log traces to console |
| `LOG_LEVEL` | No | Winston log level (default: `info`) |

---

## Gaps & Missing Implementations

### Critical Gaps

#### 1. Email Service Not Implemented
- `nodemailer` is installed as a dependency
- No `email.js` module exists anywhere in the codebase
- No `sendEmail()` function is implemented or exported
- Email templates (`welcome.hbs`, `resetpassword.hbs`) exist but nothing sends them
- **Fix:** Implement `src/utils/email.js` using nodemailer + wire it to `template.service.js`

#### 2. No JWT Auth Middleware
- `role` middleware exists and checks `req.user.role`
- But there is no middleware that extracts and verifies a JWT from the `Authorization` header and populates `req.user`
- Role-checking is completely useless without this prerequisite
- **Fix:** Create `src/middlewares/auth.js` that verifies JWT and sets `req.user`

#### 3. Queue System Fully Disabled
- BullMQ (`bullmq`) is installed
- `src/queue/notificationQueue.js` and `src/queue/worker.js` exist but are 100% commented out
- No async job processing works at all
- **Fix:** Uncomment and integrate, or remove the dependency entirely

#### 4. Notifier Module Empty
- `src/utils/notifier.js` is entirely commented out
- Was meant to orchestrate email + SMS dispatch from a single interface
- **Fix:** Implement the orchestrator using the email and SMS utilities

---

### Export / API Surface Gaps

| Gap | Detail |
|---|---|
| `config` not exported | `getConfig` / `setConfig` in `src/utils/config.js` but absent from `index.js` |
| `trace` middleware not exported | Implemented in `src/middlewares/trace.js`, commented out of barrel |
| `requestLogger` not exported | Implemented but commented out of barrel |
| `sms` not exported | Implemented but commented out of barrel |
| `template` service not exported | Implemented but commented out of barrel |
| `tracing` not exported | `src/utils/tracing.js` exists; services must find and call `initTracing()` manually |

---

### Design & Operational Gaps

| # | Gap | Detail |
|---|---|---|
| 1 | **Dual AWS SDK versions** | Both `aws-sdk` v2 and `@aws-sdk/client-s3` v3 are installed, doubling bundle size. Should standardize on v3. |
| 2 | **Twilio not in package.json** | `src/utils/sms.js` uses Twilio but the `twilio` package is not listed as a dependency. |
| 3 | **No startup env validation** | No check that required env vars are present at startup. Failures surface at runtime, not boot time. |
| 4 | **Silent service registry failure** | If `CORE_REGISTRY_URL` is not set, `registerService` silently does nothing — no warning logged. |
| 5 | **No shared Mongoose models** | Common entities (User, OTP, Notification) are left entirely to consuming services with no base schemas. |
| 6 | **No push notification support** | SMS and email are partially done but there is no FCM/APNS push notification integration despite `notifier.js` implying it was planned. |
| 7 | **Redis dependency undocumented** | `connectRedis` can return a mock object but there is no guidance on which features require a real Redis connection. |
| 8 | **Express 5 + Mongoose 7 untested** | Express 5.1.0 has breaking changes from 4.x. Combined with Mongoose 7 (MongoDB driver 5.x), compatibility has not been documented or validated. |

---

## Priority Fix Order

| Priority | Action |
|---|---|
| P0 | Implement `sendEmail()` in `src/utils/email.js` using nodemailer + template service |
| P0 | Create `src/middlewares/auth.js` — JWT extraction, verification, `req.user` population |
| P1 | Uncomment and wire the BullMQ queue system (notificationQueue + worker) |
| P1 | Implement `src/utils/notifier.js` orchestrator (email + SMS + push) |
| P2 | Export `config`, `trace`, `requestLogger`, `sms`, `template`, `tracing` in `index.js` |
| P2 | Add `twilio` to `package.json` dependencies |
| P3 | Standardize on AWS SDK v3 only — remove `aws-sdk` v2 |
| P3 | Add startup env validation (fail fast on missing required vars) |
| P3 | Add FCM/APNS push notification support |

---

## Summary

**godhan-core** is a well-structured shared library with a solid foundation in database connectivity, HTTP utilities, security primitives, and observability. However, several key features are **installed but not implemented** (email), **implemented but not exported** (config, sms, templates, tracing), or **implemented but disabled** (queue system, notifier). The most critical gap is the absence of a working email service and JWT auth middleware — both are referenced by the rest of the architecture but do not exist in the codebase.
