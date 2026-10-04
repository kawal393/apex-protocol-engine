# Apex Protocol Engine

The machine that turns a coordination problem into a protocol, wires it to a real
cryptographic evidence primitive, and registers it with **honest, verifiable status**.

This is Priority 1 (Engine) + Priority 2 (Registry) of the APEX Master Business Model.
The code is open. What the engine never claims is more important than what it does.

## What it actually does

```
problem  →  mint  →  bundle  →  register  →  status
                 │                    │
                 └── conformance ─────┘   (byte-exact vectors, real pass/fail)
```

- **mint** — takes a problem spec, derives a closed message schema, computes a
  canonical digest over it, and runs the real golden conformance vectors.
- **register** — adds the minted protocol to `registry/registry.json` with status
  flags that are set only from what is genuinely reachable right now.
- **status** — prints the registry plus a LIVE read from the seal backend
  (`GET /v1/health`: post-quantum algorithm, epoch, signatures consumed in epoch).
- **verify** — keyless, free verification of any digest or receipt id against the
  running backend. No account, no key, open to any stranger. This is the core asset.
- **seal** — metered write via `POST /v1/notarize` (requires an API key).
- **proof** — end-to-end demonstration: conformance + live health + a real keyless
  round-trip. Proves the loop instead of asserting it.

## The three signals are never conflated

| Signal | Meaning | How this engine earns it |
| --- | --- | --- |
| **VERIFIED** | a record's integrity + time-of-existence is provable | live keyless `verify` against the ledger |
| **CONFORMANT** | an implementation matches published vectors byte-for-byte | `conformance` runs real golden vectors, fails loudly |
| **REPUTABLE** | third parties actually adopt and are accountable for it | **not claimed here** — `first_customer`/`regulatory_cited` stay `false` until observed |

Proof-of-existence is not truth. Integrity is not legality. Conformance is not
quality. The engine records what exists; it never manufactures adoption.

## Honest status, by construction

Registry metrics (`seals`, `distinct_installers`, `revenue`) start `null` and are
populated only from live evidence — never promoted from a zero to a number for
marketing. A freshly minted protocol shows `spec/conf/seal/verify = PASS` because
those are demonstrable now; `pub/cust = ----` because they are not.

## What it rewires nothing

The engine reuses the **byte-identical** primitives already running in production
(`@apex/psi-verifier` / `psi-conformance`): RFC 8785 JCS, SHA-256, the domain-
separated leaf `SHA-256("PSI1:" ‖ hash)`, and the canonical Merkle root (odd node
promoted, never duplicated). It does not invent new math; it mints protocols on top
of math that is already live.

It **bridges, never replaces**: minted protocols declare `interoperates_with`
real standards (MCP, A2A, SCITT, OIDC, W3C-VC, SLSA, in-toto, Sigstore).

## Quick start

```bash
npm install
npm run engine -- list
npm run engine -- proof
npm run engine -- register agent-action-evidence
npm run engine -- status
npm run engine -- verify <digest-or-receipt-id>
```

Environment:
- `APEX_PSI_BASE` — backend base URL (defaults to the live psi-api).
- `APEX_API_KEY` — required only for `seal` (the metered write path).

## Scope of v1

The engine only mints protocols whose evidence step is expressible through the one
primitive it can prove live: **seal / verify**. Anything else is refused as
`UNSUPPORTED` rather than faked. Open a problem, mint it, verify it, register it.

## License

Apache-2.0.
