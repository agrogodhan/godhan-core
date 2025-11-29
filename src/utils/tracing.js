import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import * as opentelemetry from '@opentelemetry/api';
let provider = null;

function initTracing({ serviceName }) {
  if (provider) return provider;
  provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });
  const exporter = new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
      "http://localhost:4318/v1/traces",
  });
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  if (process.env.TRACE_CONSOLE === "true")
    provider.addSpanProcessor(
      new SimpleSpanProcessor(new ConsoleSpanExporter())
    );
  provider.register();
  console.log("[tracing] initialized", serviceName);
  return provider;
}

function getTracer(name = "godhan-core") {
  return opentelemetry.trace.getTracer(name);
}

const tracing = { initTracing, getTracer };

export default tracing;
