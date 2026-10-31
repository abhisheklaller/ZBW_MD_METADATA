import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/read.js';
import type { NightDigest } from './digest/types.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Digest } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;

// One read for the page and the JSON, so they never disagree (ADR 0001).
// null means: no file for that night → the route answers 404.
function digestOf(config: RigConfig, night: string): NightDigest | null {
  if (!NIGHT.test(night)) return null;
  try {
    return readNight(config.runsDir, night);
  } catch {
    return null;
  }
}

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();
  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));
  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night', (c) => {
    const digest = digestOf(config, c.req.param('night'));
    if (digest === null) return c.notFound();
    return c.html(
      <Layout title={`digest · ${digest.night}`} lane={lane()}>
        <Digest digest={digest} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const digest = digestOf(config, c.req.param('night'));
    if (digest === null) return c.notFound();
    return c.json(digest);
  });

  return app;
}
