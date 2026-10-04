/**
 * engine/problems.ts — the coordination problems the engine knows how to mint.
 *
 * Each is a real, bridgeable problem (§LXXVII: interoperate, don't replace).
 * v1 only mints protocols whose evidence step is expressible through the ONE
 * primitive the engine can actually prove live (seal/verify). Anything else is
 * left un-minted rather than faked.
 */
import type { ProblemSpec } from "./types.js";

export const PROBLEMS: Record<string, ProblemSpec> = {
  "agent-action-evidence": {
    id: "agent-action-evidence",
    title: "Verifiable Evidence of AI Agent Actions",
    vertical: "agent",
    primitive: "evidence",
    problem:
      "When an autonomous AI agent takes an action on behalf of a person or org, there is no portable, " +
      "third-party-verifiable record of what it decided, when, and under whose authority. This protocol " +
      "defines a canonical event envelope and a seal/verify evidence rule so any stranger can independently " +
      "confirm that a given action record existed at a given time, without trusting the agent's operator.",
    actors: ["agent", "principal", "tool", "observer"],
    events: ["action.proposed", "action.executed", "action.refused", "action.result"],
    authority_model: "principal-on-behalf-of",
    threat_model: ["retroactive_edit", "replay", "authority_spoof"],
    jurisdictions: ["EU", "US", "UK"],
    interoperates_with: ["MCP", "A2A", "SCITT", "OIDC", "W3C-VC"],
  },
  "software-provenance-attestation": {
    id: "software-provenance-attestation",
    title: "Timestamped Software Build Provenance",
    vertical: "software",
    primitive: "evidence",
    problem:
      "A build system claims it produced a given artifact from given sources, but consumers must trust the " +
      "builder's own logs. This protocol seals a canonical digest of the provenance statement so a verifier " +
      "can confirm the claim's existence and integrity at a fixed time, bridging existing attestations rather " +
      "than replacing them.",
    actors: ["builder", "publisher", "consumer"],
    events: ["build.started", "build.completed", "artifact.published"],
    authority_model: "builder-attested",
    threat_model: ["log_forgery", "artifact_swap"],
    jurisdictions: ["US", "EU"],
    interoperates_with: ["SLSA", "in-toto", "Sigstore"],
  },
};

export function listProblemIds(): string[] {
  return Object.keys(PROBLEMS);
}

export function getProblem(id: string): ProblemSpec {
  const p = PROBLEMS[id];
  if (!p) throw new Error(`unknown problem '${id}'. known: ${listProblemIds().join(", ")}`);
  return p;
}
