# APEX PSI — Open Verification Standard & SDK

The **public** layer of APEX PSI: an open, verifiable evidence standard, the
reference verifier, published test vectors, and a thin SDK client.

Anyone may verify, fork, reuse and self-host this. That is deliberate.
Verification is free forever and needs no account.

## What this repo is (and is not)

**This repo is OPEN:**
- the cryptographic primitives (RFC 8785 JCS, SHA-256, domain-separated leaf, Merkle root)
- the reference verifier and the published golden test vectors
- the SDK client to the public verify endpoint
- the published protocol schemas (the `bundles/` outputs)

**This repo is NOT the factory.** Protocol generation, the registry of record,
conformance authority, hosted issuance and the trust mark are **APEX-operated
services**, not code published here. You do not need them to verify — you only
need them if you want APEX to run the service for you at scale.

## The rule this follows

> Give away what becomes stronger when copied. Operate what becomes harder to
> replace because it accumulates. Verification is copied everywhere on purpose.
> The canonical ledger, the conformance designation and the mark are the parts
> that earn — as a service, not as a file.

## The three signals are never conflated

| Signal | Meaning |
| --- | --- |
| **VERIFIED** | a record's integrity + time-of-existence is provable (this repo does this, free) |
| **CONFORMANT** | an implementation matches the published vectors byte-for-byte |
| **REPUTABLE** | third parties actually adopt it — earned over time, never asserted |

Proof-of-existence is not truth. Integrity is not legality. Conformance is not
quality. This tool records and checks what exists; it never manufactures trust.

## How the technology works

1. A record is hashed with **SHA-256** → a 64-hex content digest.
2. A **domain-separated leaf** is computed: `SHA-256("PSI1:" ‖ digest)`.
3. Leaves are combined into a canonical **Merkle root** (odd node promoted, never duplicated).
4. The root is signed by the live APEX PSI service with **Ed25519 + post-quantum LMS-W4-SHA256**.
5. **Anyone** can later verify the digest or receipt id, keyless and free, against the ledger.

## Quick start

```bash
npm install
npm run engine -- proof                                   # conformance + live health + a real verify
npm run engine -- verify <digest-or-receipt-id>           # keyless, free
npm run engine -- seal "your decision text"               # metered write (needs APEX_API_KEY)
```

Environment:
- `APEX_PSI_BASE` — backend base URL (defaults to the live APEX PSI endpoint).
- `APEX_API_KEY` — required only for `seal` (the metered write path).

## License

Apache-2.0. The verification standard and this SDK are free for the world to use.
