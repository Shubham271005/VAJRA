import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import http from 'http';

function expressPlugin(): Plugin {
  return {
    name: 'express-dev-server',
    configureServer(server) {
      // Check if Python AI microservice is running on :8000; if not, spawn it in background
      try {
        const checkReq = http.get('http://127.0.0.1:8000/api/health', () => {});
        checkReq.on('error', () => {
          try {
            const py = spawn('.venv/bin/python', ['ml/api.py'], {
              env: { ...process.env, PYTHONPATH: 'ml' },
              stdio: 'ignore',
              detached: true
            });
            py.unref();
          } catch (e) {
            // Virtualenv or python unavailable
          }
        });
      } catch (e) {
        // Ignore check errors
      }

      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          try {
            // Dynamically import the ES module Express app
            const { app } = await import('./server/app.js');
            app(req as any, res as any, next);
          } catch (err) {
            next(err);
          }
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), expressPlugin()],
  server: {
    port: 5173
  }
});
