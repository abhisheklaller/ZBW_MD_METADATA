import type { DigestRow, NightDigest } from '../digest/types.js';

// Missing data renders as — , never an empty cell (styleguide).
const dash = (v: string | null) => (v === null || v === '' ? <span class="mute">—</span> : v);

// A row is marked when it ended in fail, or retried 3+ times (plan.md § 2a).
const marked = (r: DigestRow) => r.lastStatus === 'fail' || r.retries >= 3;

export function Digest({ digest }: { digest: NightDigest }) {
  if (digest.rows.length === 0) {
    return (
      <>
        <h1>digest · {digest.night}</h1>
        <p class="mute">nothing ran</p>
      </>
    );
  }
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {digest.badLines > 0 ? (
        <p class="mute">
          {digest.badLines} line{digest.badLines === 1 ? '' : 's'} in the log did not parse and {digest.badLines === 1 ? 'was' : 'were'} skipped.
        </p>
      ) : null}
      <table>
        <thead>
          <tr>
            <th>job</th>
            <th>owner</th>
            <th>runs</th>
            <th>retries</th>
            <th>last</th>
            <th>last error</th>
            <th>first</th>
            <th>last at</th>
          </tr>
        </thead>
        <tbody>
          {digest.rows.map((r) => (
            <tr class={marked(r) ? 'warn' : undefined}>
              <td>{r.job}</td>
              <td>{dash(r.owner)}</td>
              <td>{r.runs}</td>
              <td>{r.retries}</td>
              <td>{r.lastStatus}</td>
              <td>{dash(r.lastError)}</td>
              <td>{r.firstAt}</td>
              <td>{r.lastAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
