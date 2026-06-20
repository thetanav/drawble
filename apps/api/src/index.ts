import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import wordsRouter from './routes/words.js';

const PORT = parseInt(process.env.API_PORT || '3000');

const app = new Hono();

app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

app.use('/*', logger());

app.route('/api', wordsRouter);

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'api', timestamp: Date.now() });
});

serve({
  fetch: app.fetch,
  port: PORT,
}, () => {
  console.log(`API server running on port ${PORT}`);
});
