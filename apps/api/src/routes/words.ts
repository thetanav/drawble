import { Hono } from 'hono';
import { AVATARS, WORD_BANK } from '@draw/shared';
import type { WordPack } from '@draw/shared';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'api', timestamp: Date.now() });
});

app.get('/words/:pack', (c) => {
  // random shuffled words from the category
  const pack = c.req.param('pack') as WordPack;
  const words = WORD_BANK[pack];
  if (!words) {
    return c.json({ error: 'Invalid word pack' }, 404);
  }
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return c.json({ pack, words: shuffled, count: shuffled.length });
});

app.get('/words/:pack/random/:count', (c) => {
  const pack = c.req.param('pack') as WordPack;
  const count = parseInt(c.req.param('count') || '3');
  const words = WORD_BANK[pack];
  if (!words) {
    return c.json({ error: 'Invalid word pack' }, 404);
  }
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return c.json({ pack, words: shuffled.slice(0, count) });
}); // specific numebr for words from the category

app.get('/avatars', (c) => {
  return c.json({
    avatars: AVATARS,
  });
});

export default app;
