import client from "prom-client";
client.collectDefaultMetrics();
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 1.5, 5, 10],
});
async function observeRequest(req, res, duration) {
  try {
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.url,
        status_code: res.statusCode,
      },
      duration
    );
  } catch (e) {}
}
async function exposeMetrics(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(client.register.metrics());
}
const metrics = { observeRequest, exposeMetrics };

export default metrics;
