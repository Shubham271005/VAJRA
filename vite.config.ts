import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function expressPlugin(): Plugin {
  return {
    name: 'express-dev-server',
    configureServer(server) {
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
