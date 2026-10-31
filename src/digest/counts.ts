import type { NightDigest } from './types.js';

export type Counts = { ok: number; retry: number; fail: number };

// ok / retry / fail by each job's last status, for the board (plan.md § 2c).
export function countByLastStatus(digest: NightDigest): Counts {
  const counts: Counts = { ok: 0, retry: 0, fail: 0 };
  for (const row of digest.rows) counts[row.lastStatus]++;
  return counts;
}
