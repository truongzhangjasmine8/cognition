import { describe, expect, it } from "vitest";
import { GENESIS_HASH, computeHash, verifyChain, type ChainedEvent } from "../audit-core";

function chain(n: number): ChainedEvent[] {
  const out: ChainedEvent[] = [];
  let prev = GENESIS_HASH;
  for (let i = 1; i <= n; i++) {
    const p = { actorId: "u1", actorName: "A", actorRole: "admin", app: "t", action: `a${i}`, entityType: "E", entityId: String(i), before: null, after: JSON.stringify({ i }), createdAt: new Date(2026, 0, i) };
    const hash = computeHash(prev, p);
    out.push({ ...p, id: i, prevHash: prev, hash });
    prev = hash;
  }
  return out;
}

describe("audit hash chain", () => {
  it("verifies an intact chain", () => {
    expect(verifyChain(chain(5))).toEqual({ ok: true, count: 5 });
  });
  it("detects an edited row", () => {
    const c = chain(5);
    c[2].after = JSON.stringify({ i: 999 });
    const r = verifyChain(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.brokenAtId).toBe(3);
  });
  it("detects a deleted row", () => {
    const c = chain(5);
    c.splice(1, 1);
    const r = verifyChain(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.brokenAtId).toBe(3);
  });
  it("detects a changed actor even if the payload is intact", () => {
    const c = chain(3);
    c[0].actorRole = "agent";
    expect(verifyChain(c).ok).toBe(false);
  });
  it("detects a renamed actor", () => {
    const c = chain(3);
    c[1].actorName = "Someone Else";
    const r = verifyChain(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.brokenAtId).toBe(2);
  });
});
