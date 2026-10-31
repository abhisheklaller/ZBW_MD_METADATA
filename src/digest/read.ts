import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, JobStatus, NightDigest, ReadNight } from './types.js';

const STATUSES: readonly JobStatus[] = ['ok', 'retry', 'fail'];

type LogLine = { at: string; job: string; status: JobStatus; owner: string | null; error?: string };

// Parse one JSONL line into a log entry, or null if it does not fit the shape.
// A bad line is counted by the caller, never thrown (plan.md § 1).
function parseLine(line: string): LogLine | null {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (typeof o.status !== 'string' || !STATUSES.includes(o.status as JobStatus)) return null;
  const owner = o.owner === null || typeof o.owner === 'string' ? (o.owner as string | null) : null;
  const error = typeof o.error === 'string' ? o.error : undefined;
  return { at: o.at, job: o.job, status: o.status as JobStatus, owner, error };
}

// Read runs/<night>.jsonl into one row per job, sorted by job. Errors reading the file
// (missing, unreadable) throw to the caller: the route decides 404 vs render.
export const readNight: ReadNight = (runsDir: string, night: string): NightDigest => {
  const text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  const byJob = new Map<string, DigestRow>();
  let badLines = 0;

  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const entry = parseLine(line);
    if (entry === null) {
      badLines++;
      continue;
    }
    const row = byJob.get(entry.job);
    if (!row) {
      byJob.set(entry.job, {
        job: entry.job,
        owner: entry.owner,
        runs: 1,
        retries: entry.status === 'retry' ? 1 : 0,
        lastStatus: entry.status,
        lastError: entry.error ?? null,
        firstAt: entry.at,
        lastAt: entry.at,
      });
      continue;
    }
    row.runs++;
    if (entry.status === 'retry') row.retries++;
    // Keep the last entry by time order in the file: later line wins for status, error, owner.
    row.lastStatus = entry.status;
    row.lastError = entry.error ?? null;
    if (entry.owner !== null) row.owner = entry.owner;
    if (entry.at < row.firstAt) row.firstAt = entry.at;
    if (entry.at > row.lastAt) row.lastAt = entry.at;
  }

  const rows = [...byJob.values()].sort((a, b) => a.job.localeCompare(b.job));
  return { night, rows, badLines };
};
