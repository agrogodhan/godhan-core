# @godhan/core

Shared core utilities for Godhan microservices.

### Features

- MongoDB connection (`initDB`)
- Auth middleware (`authMiddleware`)
- Config management (`initConfig`, `getConfig`)
- Unified API response (`successResponse`, `errorResponse`)

### Usage

```javascript
const {
  initDB,
  initConfig,
  authMiddleware,
  getConfig,
  successResponse,
  errorResponse,
} = require("@godhan/core");

// DB connection
const connection = await initDB(process.env.MONGO_URI);
initConfig(connection);

// Auth middleware
app.use(authMiddleware);

// Example API
app.get("/test", async (req, res) => {
  const cashbackPercent = await getConfig("CASHBACK_PERCENT", 2);
  return successResponse(res, { cashbackPercent }, "Fetched config");
});

// Send mail with plain text
const result = await sendEmail(
  {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  {
    to: "user@example.com",
    subject: "Invoice Attached",
    text: "Please find your invoice attached.",
    attachments: [
      {
        filename: "invoice.pdf",
        path: "./files/invoice.pdf", // local file
      },
    ],
  }
);
console.log("Email Result:", result);
// send mail with template

const result = await sendEmail(
  {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  {
    to: "user@example.com",
    subject: "Welcome with Logo",
    template: "welcome",
    context: { name: "Shashank" },
    attachments: [
      {
        filename: "logo.png",
        path: "./files/logo.png",
        cid: "logo", // same as cid in template
      },
    ],
  }
);
console.log("Email Result:", result);
```
