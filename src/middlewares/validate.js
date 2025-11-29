/** Middleware to validate request body against a Joi schema */
import response from "../http/response.js";

export default (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);

  if (error) {
    return response.error(res, error.details[0].message, 400);
  }

  req.body = value;
  return next();
};
