import client from 'prom-client';
import logger from './logger.js';

client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 1, 1.5, 5, 10],
});

function observeRequest(req, res, durationSeconds) {
  try {
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.url,
        status_code: res.statusCode,
      },
      durationSeconds
    );
  } catch (err) {
    logger.warn('[core.metrics] observeRequest failed', { message: err.message });
  }
}

async function exposeMetrics(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

const metrics = { observeRequest, exposeMetrics };
export default metrics;
