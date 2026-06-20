import { Hono } from 'hono';
import { WORD_BANK } from '@draw/shared';
import type { WordPack } from '@draw/shared';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'api', timestamp: Date.now() });
});

app.get('/words/:pack', (c) => {
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
});

app.get('/avatars', (c) => {
  return c.json({
    avatars: [
      { id: 0, emoji: '😀', name: 'Happy' },
      { id: 1, emoji: '😎', name: 'Cool' },
      { id: 2, emoji: '🤖', name: 'Robot' },
      { id: 3, emoji: '👻', name: 'Ghost' },
      { id: 4, emoji: '🐱', name: 'Cat' },
      { id: 5, emoji: '🐶', name: 'Dog' },
      { id: 6, emoji: '🦊', name: 'Fox' },
      { id: 7, emoji: '🐸', name: 'Frog' },
      { id: 8, emoji: '🦁', name: 'Lion' },
      { id: 9, emoji: '🐼', name: 'Panda' },
      { id: 10, emoji: '🦄', name: 'Unicorn' },
      { id: 11, emoji: '🐙', name: 'Octopus' },
    ],
  });
});

export default app;
