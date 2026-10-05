#!/usr/bin/env node
/**
 * cli.ts — APEX PSI open verifier & SDK client.
 *
 * This is the PUBLIC layer only: verify a proof for free, prove the math conforms,
 * and (optionally) call the metered seal service with your own key. Protocol
 * generation, the registry of record, and conformance authority are NOT here —
 * they are APEX-operated services, not open code.
 *
 *   engine verify <digest-or-receipt-id>   keyless, free verification against the ledger
 *   engine proof                           conformance vectors + live health + a real verify
 *   engine seal "<decision text>"          metered write via /v1/notarize (needs APEX_API_KEY)
 */
import { runConformance } from "./engine/conformance.js";
import { verify, health, notarize, PSI_BASE } from "./client/psi.js";

async function cmdVerify(target: string) {
  const r = await verify(target);
  console.log(`VERIFY ${target}`);
  console.log(`  found=${r.found} verified=${r.verified}`);
  if (r.commit_id) console.log(`  commit_id=${r.commit_id} predicate=${r.predicate_id} phase=${r.phase} status=${r.status}`);
  if (r.merkle_root) console.log(`  merkle_root=${r.merkle_root} algo=${r.algorithm}`);
  console.log(`  queried_at=${r.queried_at} engine=${r.engine}`);
}

async function cmdSeal(decision: string) {
  const r = await notarize(decision);
  console.log(`SEALED -> receipt ${r.receipt_id}`);
  console.log(`  decision_hash=${r.decision_hash}`);
  console.log(`  merkle_leaf=${r.merkle_leaf} merkle_root=${r.merkle_root}`);
  console.log(`  post_quantum=${r.post_quantum} algo=${r.algorithm} version=${r.receipt_version}`);
  console.log(`  verify keyless: engine verify ${r.receipt_id}`);
}

async function cmdProof() {
  console.log("APEX PSI — OPEN VERIFICATION PROOF");
  console.log("==================================================");
  const conf = await runConformance();
  console.log(`[1] conformance vectors: ${conf.passed} passed, ${conf.failed} failed`);
  for (const f of conf.failures) console.log(`      FAIL ${f}`);
  console.log(`[2] live backend: ${PSI_BASE}`);
  const h = await health();
  const pq = h.post_quantum;
  console.log(`    health ok=${h.ok}  ts=${h.ts}`);
  if (pq) console.log(`    PQ ${pq.algorithm}/${pq.standard}  epoch=${pq.epoch}  sigs_used_in_epoch=${pq.signatures_used_in_epoch}`);
  const probe = "0".repeat(64);
  try {
    const r = await verify(probe);
    console.log(`[3] keyless verify route reachable: found=${r.found} verified=${r.verified} engine=${r.engine}`);
    console.log(`    (a real digest/receipt returns found=true; the read path is OPEN, FREE, no account.)`);
  } catch (e) {
    console.log(`[3] keyless verify route ERROR: ${(e as Error).message}`);
    process.exitCode = 1;
  }
  const allGreen = conf.failed === 0 && h.ok;
  console.log("==================================================");
  console.log(allGreen ? "RESULT: verification math conforms, backend live, read path open to all." : "RESULT: INCOMPLETE — see failures above.");
  if (!allGreen) process.exitCode = 1;
}

function usage() {
  console.log(`APEX PSI open verifier

  engine verify <digest-or-receipt-id>
  engine proof
  engine seal "<decision text>"`);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "verify":
      if (!rest[0]) return usage();
      await cmdVerify(rest[0]);
      break;
    case "seal":
      if (!rest[0]) return usage();
      await cmdSeal(rest.join(" "));
      break;
    case "proof":
      await cmdProof();
      break;
    default:
      usage();
  }
}

main().catch((e) => {
  console.error(`ERROR: ${(e as Error).message}`);
  process.exit(1);
});
