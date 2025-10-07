const jwt = require("jsonwebtoken");

function createAuthMiddleware(jwtSecret) {
  if (!jwtSecret) {
    throw new Error("JWT secret must be provided to createAuthMiddleware()");
  }

  return function authMiddleware(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
    }
  };
}

module.exports = { createAuthMiddleware };
