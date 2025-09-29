function successResponse(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

function errorResponse(res, error = "Something went wrong", statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    message: error,
    details,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { successResponse, errorResponse };
