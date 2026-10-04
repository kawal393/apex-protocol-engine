/**
 * engine/conformance.ts — runs the REAL golden vectors against the engine's own
 * primitives. These vectors are copied verbatim from psi-conformance (the same
 * set the browser page and the @apex/psi-verifier use), so a pass here means the
 * engine performs the identical byte-exact math the live backend does.
 *
 * This is §VIII made concrete: open technology → objective pass/fail against
 * published vectors. "verified, not asserted."
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sha256Hex, psiLeaf, merkleRoot, jcs } from "./primitives.js";

const HERE = dirname(fileURLToPath(import.meta.url));
export const VECTORS_DIR = join(HERE, "..", "..", "vectors");

async function loadVector(name: string): Promise<any> {
  return JSON.parse(readFileSync(join(VECTORS_DIR, `${name}.json`), "utf8"));
}

export interface ConformanceReport { passed: number; failed: number; failures: string[] }

/** Run every vector suite; return an honest tally. */
export async function runConformance(): Promise<ConformanceReport> {
  let passed = 0;
  const failures: string[] = [];

  // SHA-256
  for (const v of await loadVector("sha256")) {
    if ((await sha256Hex(v.input)) === v.sha256) passed++;
    else failures.push(`sha256(${JSON.stringify(v.input)}) mismatch`);
  }

  // Domain-separated leaf (R9)
  for (const v of await loadVector("leaf")) {
    if ((await psiLeaf(v.hash)) === v.leaf) passed++;
    else failures.push(`leaf(${v.hash.slice(0, 12)}) mismatch`);
  }

  // Merkle root (R8)
  for (const v of await loadVector("merkle")) {
    if ((await merkleRoot(v.leaves)) === v.root) passed++;
    else failures.push(`merkle(${v.leaves.length} leaves) mismatch`);
  }

  // RFC 8785 canonicalization
  for (const v of await loadVector("canonicalization")) {
    if (jcs(v.input) === v.canonical) passed++;
    else failures.push(`jcs mismatch: got ${jcs(v.input)}`);
  }

  // Negatives — the engine MUST distinguish a tampered value
  const neg = await loadVector("negative");
  const leafBad = await psiLeaf("b35c64e20ababba4bcd148911e8095bb1b6a583021d1c68ec83b4a3500574736");
  if (leafBad !== neg.leaf_differs_on_hash.wrong_leaf) passed++;
  else failures.push("negative/leaf failed to discriminate");

  return { passed, failed: failures.length, failures };
}
