/**
 * primitives.ts — the ONE real capability the engine wires protocols to.
 *
 * These are byte-identical to @apex/psi-verifier (psi-conformance) and to the
 * live psi-api backend: SHA-256, RFC 8785 JCS, domain-separated leaf
 * ('PSI1:' || hash), and the canonical R8 Merkle root. Zero dependencies.
 *
 * The engine never claims a capability it cannot demonstrate with these
 * functions. If a protocol cannot express its evidence step through seal/verify
 * below, the engine marks it UNSUPPORTED rather than fabricating a claim.
 */

export async function sha256Hex(input: Uint8Array | string): Promise<string> {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  const buf = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** RFC 8785 JSON Canonicalization Scheme (deterministic key order, minimal). */
export function jcs(value: unknown): string {
  if (value === null || typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(jcs).join(",")}]`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${keys.map((k) => `${JSON.stringify(k)}:${jcs(obj[k])}`).join(",")}}`;
  }
  throw new Error("JCS: unsupported value");
}

/** Domain-separated Merkle leaf over a content hash. */
export function psiLeaf(hash: string): Promise<string> {
  return sha256Hex(`PSI1:${hash.replace(/^sha256:/i, "").toLowerCase()}`);
}

/** Canonical Merkle root (R8): raw 32-byte concat, odd node promoted, never duplicated. */
export async function merkleRoot(leaves: string[]): Promise<string> {
  if (!leaves.length) throw new Error("R8: at least one leaf required");
  const toBytes = (h: string) => {
    const c = h.toLowerCase();
    const out = new Uint8Array(new ArrayBuffer(32));
    for (let i = 0; i < 32; i++) out[i] = parseInt(c.slice(i * 2, i * 2 + 2), 16);
    return out;
  };
  let level: Uint8Array[] = leaves.map(toBytes);
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 === level.length) { next.push(level[i]); continue; }
      const merged = new Uint8Array(new ArrayBuffer(64));
      merged.set(level[i], 0);
      merged.set(level[i + 1], 32);
      next.push(toBytes(await sha256Hex(merged)));
    }
    level = next;
  }
  return Array.from(level[0]).map((b) => b.toString(16).padStart(2, "0")).join("");
}
