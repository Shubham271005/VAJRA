import { app } from '../server/app.js';

export default function handler(req, res) {
  // Normalize req.url so Express routes match properly when routed through Vercel rewrites
  if (req.originalUrl && req.url !== req.originalUrl) {
    req.url = req.originalUrl;
  }
  return app(req, res);
}
