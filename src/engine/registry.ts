/**
 * engine/registry.ts — Priority 2 of the Master Business Model (§VII).
 *
 * The registry is INVENTORY + HONEST STATUS. Nothing more. It records what the
 * engine actually produced and what the live backend actually reports — never an
 * assumed market result. Adoption / revenue / cited-by are populated only from
 * observed evidence; unobserved fields stay null, they are never promoted from 0.
 *
 * The single live truth it can observe is the seal primitive's own liveness:
 * GET /v1/health returns the post-quantum epoch and how many one-time signatures
 * have been consumed in that epoch. That is REAL sealing activity, straight from
 * the running backend — the closest thing to a defensible, verifiable count.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { health } from "../client/psi.js";
import type { ProtocolBundle, RegistryEntry, ProblemSpec } from "./types.js";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REGISTRY_DIR = join(HERE, "..", "..", "registry");
export const REGISTRY_FILE = join(REGISTRY_DIR, "registry.json");

export interface Registry {
  schema: string;
  updated_at: string;
  entries: RegistryEntry[];
}

function blankRegistry(): Registry {
  return { schema: "APEX-REGISTRY/1.0.0", updated_at: new Date().toISOString(), entries: [] };
}

export function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_FILE)) return blankRegistry();
  try {
    const raw = JSON.parse(readFileSync(REGISTRY_FILE, "utf8"));
    if (!Array.isArray(raw.entries)) return blankRegistry();
    return raw as Registry;
  } catch {
    return blankRegistry();
  }
}

export function saveRegistry(reg: Registry): string {
  if (!existsSync(REGISTRY_DIR)) mkdirSync(REGISTRY_DIR, { recursive: true });
  reg.updated_at = new Date().toISOString();
  writeFileSync(REGISTRY_FILE, JSON.stringify(reg, null, 2) + "\n", "utf8");
  return REGISTRY_FILE;
}

/** Register a freshly minted bundle. Metrics start null — nothing observed yet. */
export function registerBundle(reg: Registry, spec: ProblemSpec, bundle: ProtocolBundle): RegistryEntry {
  const entry: RegistryEntry = {
    id: bundle.id,
    title: spec.title,
    vertical: spec.vertical,
    version: bundle.version,
    description: spec.problem,
    interoperates_with: spec.interoperates_with,
    bundle_path: `bundles/${bundle.id}.json`,
    status: bundle.status,
    registered_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // No adoption, no revenue, no seal-count observed at registration time.
    metrics: { seals: null, distinct_installers: null, revenue: null },
  };
  const i = reg.entries.findIndex((e) => e.id === entry.id);
  if (i >= 0) reg.entries[i] = entry;
  else reg.entries.push(entry);
  return entry;
}

/**
 * Live status snapshot, pulled from the running backend. Returns only what is
 * genuinely observable right now. If the backend is unreachable this THROWS —
 * the engine refuses to print a status it cannot verify.
 */
export interface LiveSealState {
  reachable: true;
  ok: boolean;
  pq_algorithm: string | null;
  epoch: number | null;
  signatures_used_in_epoch: number | null;
  observed_at: string;
}

export async function liveSealState(): Promise<LiveSealState> {
  const h = await health();
  const pq = h.post_quantum;
  return {
    reachable: true,
    ok: h.ok,
    pq_algorithm: pq ? `${pq.algorithm} / ${pq.standard}` : null,
    epoch: pq ? pq.epoch : null,
    signatures_used_in_epoch: pq ? pq.signatures_used_in_epoch : null,
    observed_at: h.ts,
  };
}

/** Print an honest one-line-per-entry status table. */
export function formatStatus(reg: Registry, live: LiveSealState | null): string {
  const lines: string[] = [];
  lines.push(`APEX Protocol Registry — ${reg.entries.length} protocol(s)  [schema ${reg.schema}]`);
  lines.push(`Registry file: ${REGISTRY_FILE}`);
  if (live) {
    lines.push(
      `LIVE seal primitive: reachable=${live.reachable} ok=${live.ok} ` +
        `algo=${live.pq_algorithm ?? "n/a"} epoch=${live.epoch ?? "n/a"} ` +
        `sigs_used_in_epoch=${live.signatures_used_in_epoch ?? "n/a"} (observed ${live.observed_at})`,
    );
  } else {
    lines.push("LIVE seal primitive: UNREACHABLE — status below cannot be verified right now.");
  }
  lines.push("");
  for (const e of reg.entries) {
    const s = e.status;
    const tick = (b: boolean) => (b ? "PASS" : "----");
    lines.push(
      `  ${e.id.padEnd(28)} v${e.version.padEnd(7)} ` +
        `spec:${tick(s.spec_generated)} conf:${tick(s.conformance_vectors_pass)} ` +
        `seal:${tick(s.reference_seal_wired_live)} verify:${tick(s.reference_verify_live)} ` +
        `pub:${tick(s.published)} cust:${tick(s.first_customer)} ` +
        `seals=${e.metrics.seals ?? "n/a"} rev=${e.metrics.revenue ?? "n/a"}`,
    );
  }
  return lines.join("\n");
}
