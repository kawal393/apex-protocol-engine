/**
 * client/psi.ts — thin client to the LIVE APEX PSI backend (Supabase Edge: psi-api).
 *
 * This is the single real capability every minted protocol is wired to:
 *   - verify:   keyless, free, forever  (GET /v1/verify)      — the moat
 *   - notarize: metered write           (POST /v1/notarize)   — the money tap
 *   - health:   liveness + post-quantum public key (no auth)
 *
 * Endpoints were confirmed live before this file was written. The engine does
 * not pretend a protocol is "deployable" unless it can reach these.
 */

export const PSI_BASE =
  (typeof process !== "undefined" && process.env.APEX_PSI_BASE) ||
  "https://qhtntebpcribjiwrdtdd.supabase.co/functions/v1/psi-api";

const DOC_DOMAIN = "https://apex-infrastructure.com"; // buyer/commerce surface (§2 domain split)

async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  if (!res.ok) throw new Error(`psi ${res.status}: ${text.slice(0, 300)}`);
  return body as T;
}

export interface HealthResponse {
  ok: boolean;
  ts: string;
  post_quantum: {
    algorithm: string; standard: string; public_key: string;
    tree_height: number; one_time_keys_per_epoch: number;
    epoch: number; signatures_used_in_epoch: number;
  } | null;
}

export interface VerifyResponse {
  verified: boolean;
  found: boolean;
  commit_id?: string;
  predicate_id?: string;
  phase?: string;
  status?: string;
  merkle_root?: string;
  algorithm?: string;
  created_at?: string;
  queried_hash?: string;
  queried_at?: string;
  engine?: string;
}

export interface NotarizeResponse {
  receipt_id: string;
  timestamp: string;
  decision_hash: string;
  merkle_leaf: string;
  merkle_root: string;
  ed25519_signature: string;
  post_quantum: boolean;
  pq_public_key?: string | null;
  algorithm: string;
  predicate_applied: string;
  receipt_version: string;
  engine: string;
}

/** Keyless, free verification. Accepts a 64-hex digest OR an APEX-PSI-… receipt id. */
export function verify(target: string): Promise<VerifyResponse> {
  const clean = encodeURIComponent(target.trim());
  return getJSON<VerifyResponse>(`${PSI_BASE}/v1/verify/${clean}`);
}

/** Liveness + current post-quantum public state. No auth. */
export function health(): Promise<HealthResponse> {
  return getJSON<HealthResponse>(`${PSI_BASE}/v1/health`);
}

/**
 * Metered write path. Requires an API key (env APEX_API_KEY or opts.key).
 * The 429 daily-limit response is the self-serve upsell door — surfaced, not hidden.
 */
export async function notarize(
  decision: string,
  opts: { key?: string; predicate?: string; model_id?: string; context?: unknown } = {},
): Promise<NotarizeResponse> {
  const key = opts.key || (typeof process !== "undefined" ? process.env.APEX_API_KEY : undefined);
  if (!key) throw new Error("notarize requires an API key (APEX_API_KEY) — this is the metered write path");
  return getJSON<NotarizeResponse>(`${PSI_BASE}/v1/notarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "x-apex-refer": DOC_DOMAIN },
    body: JSON.stringify({
      decision,
      predicate: opts.predicate ?? "APEX_PROTOCOL_ENGINE",
      model_id: opts.model_id ?? null,
      context: opts.context ?? null,
    }),
  });
}
