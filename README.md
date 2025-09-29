# @godhan/core

Shared core utilities for Godhan microservices.

### Features
- MongoDB connection (`initDB`)
- Auth middleware (`authMiddleware`)
- Config management (`initConfig`, `getConfig`)
- Unified API response (`successResponse`, `errorResponse`)

### Usage

```javascript
const { initDB, initConfig, authMiddleware, getConfig, successResponse, errorResponse } = require("@godhan/core");

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
