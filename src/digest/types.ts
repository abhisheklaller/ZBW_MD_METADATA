// The digest contract (plan.md § 1). Committed first, so every part of section 2 builds against it.
export type JobStatus = 'ok' | 'retry' | 'fail';

// One row per job for a night: what ran, who owned it, how it ended.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

// Reading a night never throws on a bad line: the night still renders (plan.md § 1).
export type NightDigest = {
  night: string;
  rows: DigestRow[];
  badLines: number;
};

// Read runs/<night>.jsonl into one row per job, sorted by job.
export type ReadNight = (runsDir: string, night: string) => NightDigest;
