export default function (requiredRole) {
  return function (req, res, next) {
    if (!req.user)
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        details: null,
        timestamp: new Date().toISOString(),
      });
    if (req.user.role !== requiredRole)
      return res.status(403).json({
        success: false,
        message: "Forbidden",
        details: null,
        timestamp: new Date().toISOString(),
      });
    next();
  };
};
