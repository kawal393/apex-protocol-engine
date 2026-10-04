/**
 * types.ts — shared shapes for the Protocol Engine and the Registry.
 *
 * Registry status fields are deliberately HONEST. A minted protocol records
 * what actually exists (a spec, a conformance run, a live wiring to the seal
 * primitive), never an assumed market result. Adoption, revenue and cited-by
 * counts are populated ONLY from live evidence, never asserted.
 */

/** The coordination problem handed to the engine (§V INPUT). */
export interface ProblemSpec {
  id: string;              // machine slug, e.g. "agent-action-evidence"
  title: string;
  vertical: string;        // agent | software | finance | supply-chain | health | media | energy | robotics | government
  primitive: "evidence";   // v1 engine supports the ONE real primitive: seal/verify evidence
  problem: string;
  actors: string[];
  events: string[];
  authority_model: string;
  threat_model: string[];
  jurisdictions: string[];
  interoperates_with: string[]; // real external standards to bridge (§LXXVII), not replace
}

/** Honest lifecycle flags — mirrors §V "status" but truthful by construction. */
export interface ProtocolStatus {
  spec_generated: boolean;
  conformance_vectors_pass: boolean;
  reference_seal_wired_live: boolean;   // can it actually seal via the live primitive?
  reference_verify_live: boolean;       // is verification reachable keyless & free?
  published: boolean;                    // shipped to a registry/package rail
  ietf_filed: boolean;
  first_external_installer: boolean;
  first_customer: boolean;
  regulatory_cited: boolean;
}

/** What the engine emits per protocol (§V OUTPUT), wired to the real primitive. */
export interface ProtocolBundle {
  id: string;
  version: string;
  schema: Record<string, unknown>;      // message schema (the closed field set)
  evidence_rule: string;                 // how this protocol uses seal/verify
  canonical_schema_digest: string;       // SHA-256 over JCS of the schema (§LVII reserved expression)
  conformance: { vectors_dir: string; passed: number; failed: number };
  reference_impl: { seal: string; verify: string }; // code paths that hit the LIVE psi-api
  status: ProtocolStatus;
  generated_at: string;
}

/** Registry row (§VII). The registry is inventory + honest status, nothing more. */
export interface RegistryEntry {
  id: string;
  title: string;
  vertical: string;
  version: string;
  description: string;
  interoperates_with: string[];
  bundle_path: string;
  status: ProtocolStatus;
  registered_at: string;
  updated_at: string;
  // Populated ONLY from live evidence (§XXXV). null = "not yet observed", never faked to 0-and-promoted.
  metrics: { seals: number | null; distinct_installers: number | null; revenue: number | null };
}
