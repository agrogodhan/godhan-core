import response from '../http/response.js';

/**
 * Request validation middleware factory using Joi schemas.
 *
 * Usage:
 *   router.post('/register', validate(schema), handler);              // validates req.body (default)
 *   router.get('/users',     validate(schema, 'query'), handler);     // validates req.query
 *   router.get('/users/:id', validate(schema, 'params'), handler);    // validates req.params
 *
 * Returns all validation errors at once (abortEarly: false).
 * On failure: 400 with { data: [error messages], message: 'Validation failed' }
 */
export default function validate(schema, target = 'body') {
  return function validateMiddleware(req, res, next) {
    const { error, value } = schema.validate(req[target], { abortEarly: false });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return response.error(res, messages, 'Validation failed', 400);
    }

    req[target] = value;
    return next();
  };
}
