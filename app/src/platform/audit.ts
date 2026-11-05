import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { CurrentUser } from "./auth";
import { GENESIS_HASH, computeHash, verifyChain } from "./audit-core";

export type AuditInput = {
  app: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

function serialize(v: unknown): string | null {
  return v === undefined || v === null ? null : JSON.stringify(v);
}

// Every mutation in every app goes through here. The event is chained to the
// previous one so edits to history are detectable (see verifyAuditChain).
export type DbClient = Prisma.TransactionClient;

export async function recordAudit(user: CurrentUser, input: AuditInput, tx?: DbClient) {
  if (tx) return writeEvent(tx, user, input);
  return db.$transaction((t) => writeEvent(t, user, input));
}

async function writeEvent(tx: DbClient, user: CurrentUser, input: AuditInput) {
  {
    const last = await tx.auditEvent.findFirst({ orderBy: { id: "desc" }, select: { hash: true } });
    const prevHash = last?.hash ?? GENESIS_HASH;
    const payload = {
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      app: input.app,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: serialize(input.before),
      after: serialize(input.after),
      createdAt: new Date(),
    };
    return tx.auditEvent.create({ data: { ...payload, prevHash, hash: computeHash(prevHash, payload) } });
  }
}

export async function verifyAuditChain() {
  const events = await db.auditEvent.findMany({ orderBy: { id: "asc" } });
  return verifyChain(events);
}
