function success(res, data, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    status: statusCode,
    timestamp: new Date().toISOString(),
  });
}

function error(res, data=null, message="Something went wrong", statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
    status: statusCode,
    timestamp: new Date().toISOString(),
  });
}

const response = { success, error };

export default response;
