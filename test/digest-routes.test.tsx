import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

// A temp runs dir: runs/ is a read-only fixture (plan.md § 2d).
function tempRuns(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return dir;
}

const config = (runsDir: string) => ({ adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir });

const okNight = '{"at":"2026-11-01T01:00:00+01:00","job":"a/one","status":"ok","owner":"rook"}\n';
const badNight = `${okNight}not json at all\n{"at":"2026-11-01T02:00:00+01:00","job":"b/two","status":"fail","owner":null,"error":"boom"}\n`;

describe('digest routes', () => {
  it('renders the page for a night that exists', async () => {
    const app = createApp(config(tempRuns({ '2026-11-01.jsonl': okNight })));
    const res = await app.request('/digest/2026-11-01');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('a/one');
  });

  it('returns 404 for a night with no file', async () => {
    const app = createApp(config(tempRuns({})));
    expect((await app.request('/digest/2026-12-25')).status).toBe(404);
    expect((await app.request('/api/digest/2026-12-25')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const app = createApp(config(tempRuns({ '2026-11-02.jsonl': '' })));
    const res = await app.request('/digest/2026-11-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders a night with a bad line, and counts it', async () => {
    const app = createApp(config(tempRuns({ '2026-11-01.jsonl': badNight })));
    const page = await app.request('/digest/2026-11-01');
    expect(page.status).toBe(200);
    const json = (await (await app.request('/api/digest/2026-11-01')).json()) as { rows: unknown[]; badLines: number };
    expect(json.badLines).toBe(1);
    expect(json.rows).toHaveLength(2);
  });

  it('the page and the JSON agree on jobs and order', async () => {
    const app = createApp(config(tempRuns({ '2026-11-01.jsonl': badNight })));
    const json = (await (await app.request('/api/digest/2026-11-01')).json()) as { rows: { job: string }[] };
    const page = await (await app.request('/digest/2026-11-01')).text();
    const jobsJson = json.rows.map((r) => r.job);
    const jobsPage = [...page.matchAll(/<td>([a-z]+\/[a-z]+)<\/td>/g)].map((m) => m[1]);
    expect(jobsPage).toEqual(jobsJson);
  });
});
