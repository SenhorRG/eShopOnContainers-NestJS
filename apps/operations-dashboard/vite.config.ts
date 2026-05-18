import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const dir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(dir, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, monorepoRoot, '');
  const lokiTarget = (env.VITE_ESHOP_LOKI_URL ?? 'http://127.0.0.1:3100').replace(/\/$/, '');
  const prometheusTarget = (env.VITE_ESHOP_PROMETHEUS_URL ?? 'http://127.0.0.1:9099').replace(/\/$/, '');
  const jaegerTarget = (env.VITE_ESHOP_JAEGER_URL ?? 'http://127.0.0.1:16686').replace(/\/$/, '');

  return {
    plugins: [react()],
    envDir: monorepoRoot,
    server: {
      port: 5188,
      proxy: {
        '/observability/loki': {
          target: lokiTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/observability\/loki/, ''),
        },
        '/observability/prometheus': {
          target: prometheusTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/observability\/prometheus/, ''),
        },
        '/observability/jaeger': {
          target: jaegerTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/observability\/jaeger/, ''),
        },
      },
    },
    preview: {
      port: 5188,
      proxy: {
        '/observability/loki': {
          target: lokiTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/observability\/loki/, ''),
        },
        '/observability/prometheus': {
          target: prometheusTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/observability\/prometheus/, ''),
        },
        '/observability/jaeger': {
          target: jaegerTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/observability\/jaeger/, ''),
        },
      },
    },
  };
});
