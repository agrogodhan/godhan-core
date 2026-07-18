# @godhan/core

Shared utilities for Godhan Node.js microservices — DB connections, auth, HTTP responses,
security, and misc. platform utilities. Ships as **ESM only** (`"type": "module"`); consuming
services must be ESM too (`"type": "module"` in their own `package.json`).

Nothing here stores secrets or config — every function takes what it needs (URIs, secrets,
clients) as arguments from the caller's own environment. This keeps `@godhan/core` a pure
utility layer with no hidden per-service state.

## Usage

Everything is exposed as a single namespaced default export:

```javascript
import core from "@godhan/core";
```

There are **no other named exports** — always go through `core.<namespace>.<fn>`.

### `core.db`

```javascript
const conn = await core.db.connectMongo({ uri: process.env.MONGO_URI, logger: appLogger });
const redis = await core.db.connectRedis({ url: process.env.REDIS_URL, enabled: true, logger: appLogger });
```
- `connectMongo` retries with a fixed delay (`retryMs`, default 2000ms) up to `maxRetries` (default 10) before throwing.
- `connectRedis` returns a full no-op mock (same method surface) when `enabled` is false or omitted, so service code doesn't need to branch on whether Redis is configured.

### `core.http`

```javascript
core.http.response.success(res, data, message, statusCode);   // default message "Success", 200
core.http.response.error(res, data, message, statusCode);     // default message "Something went wrong", 500

app.use(core.http.createErrorHandler(appLogger));  // register LAST — returns a 4-arg Express error middleware

const client = core.http.apiClient("http://cattle-service", () => process.env.SERVICE_TOKEN, { logger: appLogger });
```

### `core.middleware`

```javascript
const requireAuth = core.middleware.createAuth(process.env.JWT_SECRET); // sets req.user on success
app.use(requireAuth);

app.use(core.middleware.trace);                          // sets req.traceId, echoes X-Trace-Id
app.use(core.middleware.createRequestLogger(appLogger));  // per-request access log + metrics
app.use(core.middleware.asyncHandler(fn));                // wrap an async route handler

router.delete("/users/:id", requireAuth, core.middleware.role("admin"), handler);
router.post("/register", core.middleware.validate(joiSchema), handler); // validates req.body by default
```

### `core.security`

```javascript
const token = core.security.jwt.sign(payload, { secret, expiresIn: "15m" });
const decoded = core.security.jwt.verify(token, { secret });

const hashed = await core.security.hashUtils.hash(plain, saltRounds);
const ok = await core.security.hashUtils.compare(plain, hashed);

const sig = core.security.hmac.createSignature(rawBody, webhookSecret);
const valid = core.security.hmac.verifySignature(rawBody, signature, webhookSecret);
```

### `core.utils`

```javascript
const logger = core.utils.createAppLogger({ service: "user-service", level: "info", pretty: true });

core.utils.date.now();
core.utils.date.addDays(date, 7);
core.utils.date.format(date, "YYYY-MM-DD");

await core.utils.s3.uploadToS3({ s3Client, bucket, key, buffer, contentType });
await core.utils.s3.getPresignedUrlUpload({ s3Client, bucket, key, contentType });
await core.utils.s3.getPresignedUrlView({ s3Client, bucket, key });
await core.utils.s3.deleteFromS3({ s3Client, bucket, key });
// s3Client is a caller-created @aws-sdk/client-s3 S3Client — core does not create or store one.

await core.utils.email.sendEmail({ transporter, from, to, subject, html, text });
await core.utils.email.sendTemplateEmail({ transporter, from, to, subject, templateName, context });
await core.utils.sms.sendOtp({ twilioClient, from, to, code, ttlMinutes });
await core.utils.notifier.notifyEmail({ transporter, ...});   // thin wrapper over email/sms with error swallowing
await core.utils.notifier.notifySMS({ twilioClient, ...});

const value = await core.utils.config.getConfig("CASHBACK_PERCENT", 2); // Mongo-backed KV, short in-memory cache
await core.utils.config.setConfig("CASHBACK_PERCENT", "5", "number");

core.utils.metrics.observeRequest(req, res, durationSeconds);
app.get("/metrics", core.utils.metrics.exposeMetrics); // Prometheus text format

core.utils.tracing.initTracing({ serviceName, endpoint, consoleEnabled, logger });
await core.utils.registry.registerService({ registryUrl, name, version, port, healthUrl });
```

`transporter` (nodemailer), `twilioClient` (Twilio SDK), and `s3Client` (`@aws-sdk/client-s3`)
are always created and owned by the calling service, not by `@godhan/core` — this package has
no email/SMS/AWS SDK client dependencies of its own, only the S3 v3 request-signing helpers.

## Design notes for anyone extending this package

- No side effects on import beyond what's needed for the exports to work (e.g. `core.utils.metrics`
  starts collecting default Node.js process metrics on import, because `/metrics` endpoints expect
  data to be available immediately on first scrape — this is intentional, not incidental).
- Every function takes credentials/config as arguments — don't add `process.env` reads inside this
  package; that keeps it testable and prevents one service's env from silently leaking into another's.
- Keep `package.json` `dependencies` limited to packages actually `import`-ed somewhere in `src/` —
  this package is a transitive dependency of every Godhan service, so unused deps here cost install
  time and disk across the whole platform, not just locally.
