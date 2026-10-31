import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  it('reads one row per job from the night on disk', () => {
    const { rows, badLines } = readNight('runs', '2026-10-28');
    expect(rows).toHaveLength(5);
    expect(badLines).toBe(1);
    expect(rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('counts runs and retries, and keeps the last status and error', () => {
    const { rows } = readNight('runs', '2026-10-28');
    const refresh = rows.find((r) => r.job === 'fixtures/refresh');
    expect(refresh).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', owner: 'rook' });
    const backup = rows.find((r) => r.job === 'notes/backup');
    expect(backup).toMatchObject({ runs: 1, lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row whose owner is null', () => {
    const { rows } = readNight('runs', '2026-10-28');
    const render = rows.find((r) => r.job === 'digest/render');
    expect(render?.owner).toBeNull();
  });
});
