import { createHash } from "node:crypto";

export const GENESIS_HASH = "0".repeat(64);

export type AuditPayload = {
  actorId: string;
  actorName: string;
  actorRole: string;
  app: string;
  action: string;
  entityType: string;
  entityId: string;
  before: string | null;
  after: string | null;
  createdAt: Date;
};

export function computeHash(prevHash: string, p: AuditPayload): string {
  const body = JSON.stringify([
    prevHash,
    p.actorId,
    p.actorName,
    p.actorRole,
    p.app,
    p.action,
    p.entityType,
    p.entityId,
    p.before,
    p.after,
    p.createdAt.toISOString(),
  ]);
  return createHash("sha256").update(body).digest("hex");
}

export type ChainedEvent = AuditPayload & { id: number; prevHash: string; hash: string };

export type ChainVerification =
  | { ok: true; count: number }
  | { ok: false; count: number; brokenAtId: number; reason: string };

// Walks events in insertion order and recomputes every hash. Any edited, deleted
// or reordered row breaks the chain from that point on.
export function verifyChain(events: ChainedEvent[]): ChainVerification {
  let prev = GENESIS_HASH;
  for (const e of events) {
    if (e.prevHash !== prev) {
      return { ok: false, count: events.length, brokenAtId: e.id, reason: "prevHash does not match previous event" };
    }
    const expected = computeHash(prev, e);
    if (expected !== e.hash) {
      return { ok: false, count: events.length, brokenAtId: e.id, reason: "stored hash does not match event contents" };
    }
    prev = e.hash;
  }
  return { ok: true, count: events.length };
}
