# @godhan/core

Shared core utilities for Godhan microservices.

### Features

- MongoDB connection (`initDB`)
- Auth middleware (`authMiddleware`)
- Config management (`initConfig`, `getConfig`)
- Unified API response (`successResponse`, `errorResponse`)

### Usage

```javascript
import {
  initDB,
  initConfig,
  authMiddleware,
  getConfig,
  successResponse,
  errorResponse,
} from "@godhan/core";

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


// Upload Images/Video/pdf or asset to S3
import { createS3Util } from "@godhan/core";

const s3Util = createS3Util({
  region: "ap-south-1",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  bucket: "my-bucket",
});

// for single video/image/ assets
let path = "/user/images"
const key = await s3Util.uploadToS3(req.file, path);

// for multiple images/video/ assets
let path = "/user/images"
const keys = await s3Util.uploadToS3(req.files, "images");

await s3Util.deleteFromS3("videos/sample.mp4");
// or multiple
await s3Util.deleteFromS3(["videos/1.mp4", "videos/2.mp4"]);

// inside an Express route
router.get("/video/:key", async (req, res) => {
  await s3Util.streamFromS3(res, `videos/${req.params.key}`);
});

// call from app
GET /video/1696697771234_demo.mp4

/**
 * s3Util.uploadToS3,          // handles both single/multiple uploads
  s3Util.uploadSingle,    // optional handle single upload
    s3Util.getSignedReadUrl, // for read signed URLs 
    s3Util.getSignedUploadUrl,  // for upload signed URLs
 * /

```
