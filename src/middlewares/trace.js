import { v4 as uuidv4 } from 'uuid';

export default function(req, res, next) {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
};