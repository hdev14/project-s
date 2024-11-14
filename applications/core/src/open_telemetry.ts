import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { NodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

const configuration: Partial<NodeSDKConfiguration> = process.env.NODE_ENV === 'test'
  ? ({
    serviceName: 'core',
    traceExporter: new ConsoleSpanExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  }) : ({
    serviceName: 'core',
    traceExporter: new OTLPTraceExporter({
      url: process.env.JEAGER_TRACING_URL ?? 'http://localhost:4318/v1/traces',
      headers: {}
    }),
    metricReader: new PrometheusExporter({
      port: 9464,
    }),
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

const sdk = new NodeSDK(configuration);

sdk.start();
