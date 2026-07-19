# User-Service Analysis

> **Date:** 2026-05-08
> **Service Path:** D:\Godhan\godhan-services\user-service
> **Purpose:** Understand how godhan-core is consumed, identify gaps to implement in core

---

## Project Overview

User-service is the **authentication and user management microservice** for the Godhan platform. It handles registration, login (email, mobile, Google OAuth), OTP verification, profile management, file uploads, family members, membership plans, and wallet webhooks. It consumes `@godhan/core` as its shared utility library.

---

## Directory Structure

```
user-service/
├── src/
│   ├── config/
│   │   ├── nodemailer.js           # SMTP configuration
│   │   ├── s3.js                   # AWS S3 client setup
│   │   └── twilio.js               # Twilio SMS configuration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── auth.controller_old.js  # Deprecated
│   │   ├── user.controller.js
│   │   ├── membership.controller.js
│   │   ├── upload.controller.js
│   │   ├── familyMember.controller.js
│   │   └── walletWebhook.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification → req.user
│   │   └── validate.middleware.js  # Joi validation wrapper
│   ├── models/
│   │   ├── user.model.js
│   │   ├── otp.model.js
│   │   ├── refreshtoken.model.js
│   │   ├── emailverification.model.js
│   │   ├── familyMember.model.js
│   │   ├── membership.model.js
│   │   ├── media.model.js
│   │   ├── transaction.model.js
│   │   └── template.model.js
│   ├── routes/
│   │   ├── auth.routes.js          # ACTIVE
│   │   ├── user.routes.js          # DISABLED
│   │   ├── membership.routes.js    # DISABLED
│   │   ├── upload.routes.js        # DISABLED
│   │   ├── familyMember.routes.js  # DISABLED
│   │   └── walletWebhook.routes.js # DISABLED
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── auth.service_old.js     # Deprecated
│   │   ├── user.service.js
│   │   ├── otp.service.js
│   │   ├── google.service.js
│   │   ├── membership.service.js
│   │   ├── upload.service.js
│   │   ├── familyMember.service.js
│   │   └── walletWebhook.service.js
│   ├── utils/
│   │   ├── authSchemas.js
│   │   ├── profileSchemas.js
│   │   ├── familyMemberSchemas.js
│   │   ├── userUtils.js            # Mostly commented/incomplete
│   │   └── validate.js
│   ├── validators/
│   │   ├── auth.validators.js
│   │   └── upload.validators.js
│   ├── app.js
│   └── server.js
├── uploads/                        # Local upload buffer
├── .env
├── Dockerfile                      # Empty placeholder
├── package.json
└── README.md                       # Only contains "# user-service"
```

---

## All API Endpoints

### Auth Routes — `/api/v1/auth` (ACTIVE)

| Method | Path | Controller | Auth |
|---|---|---|---|
| POST | `/register/email` | `authController.registerEmail` | Public |
| GET | `/verify-email` | `authController.verifyEmail` | Public (token in query) |
| POST | `/send-otp` | `authController.sendOtp` | Public |
| POST | `/verify-otp` | `authController.verifyOtp` | Public |
| POST | `/login/email` | `authController.loginEmailPassword` | Public |
| POST | `/login/mobile` | `authController.loginMobilePassword` | Public |
| POST | `/google` | `authController.googleLogin` | Public |
| POST | `/refresh` | `authController.refresh` | Public |
| POST | `/logout` | `authController.logout` | Public |
| POST | `/set-password` | `authController.setPassword` | `requireAuth` |

### User Routes — `/api/v1/users` (ALL DISABLED)

| Method | Path | Controller | Auth |
|---|---|---|---|
| POST | `/:id/uploadProfileImage` | `userController.uploadUserImage` | — |
| PUT | `/:id` | `userController.updateUserById` | — |
| GET | `/:id` | `userController.getUserDetails` | — |
| GET | `/` | `userController.getUsersList` | — |

### Membership Routes — `/api/v1/membership` (DISABLED)

| Method | Path | Controller | Auth |
|---|---|---|---|
| GET | `/plans` | `membershipController.listPlans` | Public |
| POST | `/plans` | `membershipController.createPlan` | `auth + role('admin')` |
| POST | `/upgrade` | `membershipController.upgrade` | `auth` |

### Upload Routes — `/api/v1/upload` (DISABLED)

| Method | Path | Controller | Auth |
|---|---|---|---|
| POST | `/profile` | `uploadController.uploadProfile` | `requireAuth` |
| POST | `/presign` | `uploadController.presign` | `requireAuth` |
| POST | `/save-after-upload` | `uploadController.saveAfterPresign` | `requireAuth` |

### Family Member Routes — `/api/v1/family` (DISABLED)

| Method | Path | Controller | Auth |
|---|---|---|---|
| POST | `/` | `familyMemberController.add` | `authMiddleware` |
| PUT | `/:id` | `familyMemberController.update` | `authMiddleware` |
| DELETE | `/:id` | `familyMemberController.delete` | `authMiddleware` |
| GET | `/` | `familyMemberController.list` | `authMiddleware` |
| GET | `/:id` | `familyMemberController.get` | `authMiddleware` |

### Wallet Webhook — `/api/v1/webhooks/wallet` (DISABLED)

| Method | Path | Controller | Auth |
|---|---|---|---|
| POST | `/` | `walletWebhook.handle` | HMAC signature |

---

## Mongoose Models / Schemas

### User
```javascript
{
  name: String,
  mobile: String (unique, indexed, sparse),
  mobileVerified: Boolean (default: false),
  email: String (unique),
  emailVerified: Boolean (default: false),
  passwordHash: String,
  role: enum["farmer","hub","admin","user"] — ⚠️ defined twice with conflicting values,
  membership: {
    plan: String (default: "normal"),
    expiresAt: Date
  },
  aadhar: String (default: ""),
  isVerified: Boolean (default: false),
  googleId: String (unique, indexed, sparse),
  referralCode: String,
  referredBy: String,
  profilePicture: String (default: ""),
  permissions: [String],
  deviceTokens: [String],
  address: { country, street, city, state, pincode },
  timestamps: true
}
```

### Otp
```javascript
{
  mobile: String (required, indexed),
  code: String (required),
  expiresAt: Date (required),
  used: Boolean (default: false),
  compound index: { mobile, code }
}
```

### RefreshToken
```javascript
{
  token: String (required, indexed),
  user: ObjectId → User (required),
  issuedAt: Date (default: now),
  expiresAt: Date (required),
  revoked: Boolean (default: false),
  replacedByToken: String
}
```

### EmailVerification
```javascript
{
  user: ObjectId → User (required),
  token: String (required, indexed),
  expiresAt: Date (required),
  used: Boolean (default: false)
}
```

### FamilyMember
```javascript
{
  userId: ObjectId → User (required),
  name: String (required),
  relation: String (required),
  age: Number,
  gender: String,
  contact: String,
  address: String,
  timestamps: true
}
```

### Membership
```javascript
{
  key: String (unique),
  name: String,
  price: Number,
  durationDays: Number (default: 365),
  benefits: Mixed,
  timestamps: true
}
```

### Media
```javascript
{
  ownerId: ObjectId (required),
  ownerType: enum["user","cattle","document"] (required),
  module: String (default: "unknown"),
  mimeType: String,
  size: Number,
  width: Number,
  height: Number,
  duration: Number,    // seconds, for audio/video
  filename: String,
  s3Key: String (required),
  url: String (required),
  ai: {
    processed: Boolean (default: false),
    modelVersion: String,
    results: Mixed
  },
  timestamps: true
}
```

### Transaction
```javascript
{
  txnId: String (required, unique),
  userId: ObjectId → User,
  type: enum["wallet-topup","membership-upgrade"],
  amount: Number,
  status: enum["initiated","success","failed"] (default: "initiated"),
  meta: Mixed,
  timestamps: true
}
```

### Template
```javascript
{
  key: String (unique),
  channel: enum["email","sms"],
  subject: String,
  html: String,
  text: String,
  timestamps: true
}
```

---

## How godhan-core Is Used

This is the most critical section — it reveals exactly which core functions the user-service expects.

### Import Pattern
```javascript
import core from '@godhan/core';
```

### Functions Called from Core

| Core Path | Used In | Call |
|---|---|---|
| `core.db.connectMongo()` | `server.js` | Database connection on startup |
| `core.utils.logger` | `server.js` | App-level logging |
| `core.security.jwt.verify()` | `auth.middleware.js` | Verify Bearer token, populate req.user |
| `core.security.jwt.sign()` → `core.jwt.sign()` | `auth.service.js` | Sign access token |
| `core.security.hmac.verifySignature()` | `walletWebhook.service.js` | Verify webhook payload signature |
| `core.http.response.success()` | All controllers | Send success JSON response |
| `core.http.response.error()` | All controllers | Send error JSON response |
| `core.http.errorHandler` | `app.js` | Global Express error middleware |
| `core.middleware.asyncHandler` | Route files | Async route wrapper |
| `core.middleware.auth` | Membership/upload routes | JWT auth middleware |
| `core.middleware.role('admin')` | Membership routes | Admin role guard |
| `core.middleware.validate(schema)` | `validate.middleware.js` | Joi validation |
| `core.email.sendTemplateEmail()` | `auth.controller.js` | Send email verification email |
| `core.sms.sendOtp()` | `otp.service.js` | Send OTP via Twilio |
| `core.utils.s3.uploadToS3()` | `upload.service.js` | Direct S3 upload |
| `core.utils.s3.getPresignedUrlUpload()` | `upload.service.js` | Presigned upload URL |
| `core.utils.s3.getPresignedUrlView()` | `upload.service.js` | Presigned view URL |
| `core.utils.s3.deleteFromS3()` | `upload.service.js` | Delete S3 object |
| `core.utils.date.addDays()` | `membership.service.js`, `walletWebhook.service.js` | Membership expiry calculation |

### Core Paths That Do NOT Exist Yet (Gap Calls)
These are called by user-service but are not implemented or exported in godhan-core:

| Called As | Status in Core |
|---|---|
| `core.email.sendTemplateEmail()` | **MISSING** — no email module exists in core |
| `core.sms.sendOtp()` | **NOT EXPORTED** — implemented but commented out of index.js |
| `core.middleware.auth` | **MISSING** — no auth middleware exported from core |
| `core.jwt.sign()` | **WRONG PATH** — exists as `core.security.jwt.sign()`, not `core.jwt.sign()` |
| `core.utils.date.addDays()` | Correct path |
| `core.utils.s3.*` | Correct paths |

---

## External Integrations

### AWS S3
- **Config:** `src/config/s3.js`
- **Env vars:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`
- **Used for:** Profile image upload (direct + presigned), media management
- **Sharp library:** Used to extract image width/height metadata on direct upload

### Email (SMTP via Nodemailer)
- **Config:** `src/config/nodemailer.js`
- **Env vars:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- **Used for:** Email verification on registration
- **Template name used:** `"verification"` (passed to `core.email.sendTemplateEmail`)
- **Variables passed:** `{ name, verifyUrl }` (verifyUrl = deep link `godhan://verify-email?token=...`)

### SMS (Twilio)
- **Config:** `src/config/twilio.js`
- **Env vars:** `TWILIO_SID`, `TWILIO_AUTH`, `TWILIO_FROM`
- **Used for:** OTP delivery for mobile login/registration
- **OTP TTL:** `OTP_TTL_MINUTES` env var (default: 10 minutes)

### Google OAuth
- **Library:** `google-auth-library`
- **Env var:** `GOOGLE_CLIENT_ID_WEB`
- **Flow:** Client sends Google `idToken` → service verifies → upserts user → returns auth tokens
- **User fields populated:** `googleId`, `email`, `emailVerified=true`, `provider="google"`

### Wallet Webhook
- **Env var:** `WALLET_WEBHOOK_SECRET`
- **Signature method:** HMAC-SHA256 via `core.security.hmac.verifySignature()`
- **On success + type=membership-upgrade:** Upgrades user membership, creates Transaction record

---

## Environment Variables

```
# Server
PORT=3001

# Database
MONGO_URI=mongodb+srv://...

# JWT / Auth
JWT_SECRET=godhan_super_secret_key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=30
BCRYPT_SALT_ROUNDS=12
EMAIL_VERIF_TTL_HOURS=24
OTP_TTL_MINUTES=10

# Google OAuth
GOOGLE_CLIENT_ID_WEB=<your-google-client-id>

# Twilio
TWILIO_SID=ACxxxx
TWILIO_AUTH=xxxx
TWILIO_FROM=+1XXXXXXXXX

# Email / SMTP
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=xxx
EMAIL_PASS=xxx
EMAIL_FROM='Godhan <agrogodhan@gmail.com>'

# AWS S3
AWS_REGION=ap-south-1
AWS_S3_BUCKET=godhan-assets
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# App Links
APP_BASE_URL=https://api.yourdomain.com
APP_DEEP_LINK_SCHEME=godhan://verify-email

# Redis (disabled)
REDIS_URL=redis://localhost:6379
ENABLE_REDIS=false

# Webhooks
WALLET_WEBHOOK_SECRET=replace_with_webhook_secret

# Observability (disabled)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
TRACE_CONSOLE=true
CORE_REGISTRY_URL=http://localhost:8080
LOG_LEVEL=info
```

---

## Gaps & Bugs Found

### Critical Bugs

| # | File | Issue |
|---|---|---|
| 1 | `user.service.js` | `updateUserById()` passes `file` as 3rd param to `User.updateOne()` — invalid, breaks on call |
| 2 | `upload.service.js` | Wrong import path: `"./src/models/media.model.js"` should be `"../models/media.model.js"` |
| 3 | `s3.js` (config) | References `logger.info(...)` but `logger` is never imported |
| 4 | `user.model.js` | `role` field defined twice with conflicting enum values — Mongoose uses the first |
| 5 | `auth.service.js` | Uses `core.jwt.sign()` — this path doesn't exist; correct is `core.security.jwt.sign()` |

### Routes Disabled (Entire Features Non-Functional)

All of these are implemented but commented out in `app.js`:
- `/api/v1/users` — user CRUD
- `/api/v1/membership` — membership plans and upgrades
- `/api/v1/webhooks/wallet` — wallet webhook processing
- `/api/v1/upload` — file/media uploads
- `/api/v1/family` — family member management

### Disabled Infrastructure in app.js / server.js

```javascript
// app.use(core.middleware.trace);          // Distributed tracing headers
// app.use(middleware.requestLogger);       // Request logging
// app.get('/metrics', exposeMetrics);      // Prometheus metrics
// core.utils.tracing.initTracing({...});   // OpenTelemetry
// core.utils.registry.registerService({...}); // Service registry
// core.db.connectRedis({...});             // Redis connection
```

### Notifications Commented Out

In `membership.service.js` and `walletWebhook.service.js`:
```javascript
// await core.utils.notifier.notifyEmail({ ... });
// await core.utils.notifier.notifySMS({ ... });
```
The notifier orchestrator is expected by user-service but doesn't exist in core.

### Incomplete Implementations

| Feature | Status |
|---|---|
| OTP hardcoded | `userUtils.js` has test OTP `"123456"` — never cleaned up |
| Pagination | `getUsersList()` has pagination code but not wired |
| Image metadata | `saveAfterPresign` doesn't extract width/height (Sharp available but unused) |
| Profile picture signing | Presigned URL generated on upload but not re-generated on view |
| Refresh token cleanup | No TTL index on RefreshToken collection — stale tokens never deleted |

### Code Quality Issues

| Issue | Detail |
|---|---|
| Duplicate packages | Both `bcrypt` and `bcryptjs` in package.json |
| Module inconsistency | Mixed ES modules and CommonJS across route/service files |
| Inconsistent response path | Some files use `core.response.*`, others use `core.http.response.*` |
| Dead code | `auth.controller_old.js`, `auth.service_old.js` never removed |
| No validation on most routes | Only auth routes have Joi validation; user/upload/family routes don't |
| No rate limiting | Auth endpoints (login, OTP) have no rate limiting |
| No tests | Zero test files anywhere |
| Empty Dockerfile | No containerization |
| No .env.example | `.env` has real-looking placeholder values but no example file |

---

## What This Tells Us About godhan-core Gaps

Based on actual consumption by user-service, these are the **exact things godhan-core must implement**:

### Must Implement (Blocking user-service functionality)

| Priority | Gap | Details |
|---|---|---|
| **P0** | `core.email.sendTemplateEmail(opts)` | Called in `auth.controller.js` for email verification. Must accept `{ to, templateName, subject, context }` and use nodemailer + Handlebars template service |
| **P0** | Export `core.sms` (sendOtp, sendSms) | Called in `otp.service.js`. Implemented in core but not exported via `index.js` |
| **P0** | Export `core.middleware.auth` | Called in membership and upload routes. Must be a JWT-verification middleware that populates `req.user` |
| **P0** | Fix `core.jwt.sign()` path | user-service calls `core.jwt.sign()` but the export is at `core.security.jwt.sign()`. Either add alias or user-service must be updated |

### Should Implement (Non-blocking but expected)

| Priority | Gap | Details |
|---|---|---|
| **P1** | `core.utils.notifier` | `membership.service.js` and `walletWebhook.service.js` call `core.utils.notifier.notifyEmail()` and `.notifySMS()` — currently commented out waiting for this |
| **P1** | Export `core.utils.config` | Not exported from `index.js` — services need dynamic config |
| **P2** | Export `core.middleware.trace` | Disabled in `app.js` but the intent is clear |
| **P2** | Export `core.middleware.requestLogger` | Disabled in `app.js` |
| **P2** | Export `core.utils.tracing` | `initTracing()` disabled in `server.js` |

---

## Summary

User-service is a well-designed microservice with solid architecture but **most features are disabled** — only authentication is live. The service was built anticipating a fully-featured `@godhan/core` that doesn't yet exist. Specifically:

1. **Email sending (`core.email.sendTemplateEmail`)** is called in auth but the function doesn't exist in core — email verification is broken.
2. **SMS (`core.sms`)** is implemented in core but not exported — OTP delivery path is broken.
3. **Auth middleware (`core.middleware.auth`)** is used in route files but doesn't exist in core — membership, upload routes can't be enabled without it.
4. **Notifier (`core.utils.notifier`)** is referenced for post-membership/webhook notifications but is completely commented out in core.

Once these four things are implemented in godhan-core, the user-service can have all its routes enabled and become fully functional.
