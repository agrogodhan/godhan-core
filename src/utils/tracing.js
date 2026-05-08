import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import * as opentelemetry from '@opentelemetry/api';
import coreLogger from './logger.js';

/**
 * OpenTelemetry tracing — no config stored here.
 * Caller provides endpoint, flags, and their service logger from the environment.
 *
 * Usage (in service server.js):
 *   core.utils.tracing.initTracing({
 *     serviceName: 'user-service',
 *     endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
 *     consoleEnabled: process.env.TRACE_CONSOLE === 'true',
 *     logger: appLogger,
 *   });
 */

let provider = null;

function initTracing({
  serviceName,
  endpoint = 'http://localhost:4318/v1/traces',
  consoleEnabled = false,
  logger = coreLogger,
}) {
  if (!serviceName) throw new Error('[core.tracing] serviceName is required');
  if (provider) return provider;

  provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  provider.addSpanProcessor(
    new SimpleSpanProcessor(new OTLPTraceExporter({ url: endpoint }))
  );

  if (consoleEnabled) {
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  provider.register();
  logger.info('[core.tracing] initialized', { serviceName, endpoint });
  return provider;
}

function getTracer(name = 'godhan-core') {
  return opentelemetry.trace.getTracer(name);
}

const tracing = { initTracing, getTracer };
export default tracing;
