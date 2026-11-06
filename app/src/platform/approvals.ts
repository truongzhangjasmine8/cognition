import { db } from "@/lib/db";
import type { CurrentUser } from "./auth";
import { authorize, can, type Permission } from "./rbac";
import { recordAudit, type DbClient } from "./audit";

export class SelfApprovalError extends Error {
  constructor() {
    super("Requests cannot be approved by the person who made them");
    this.name = "SelfApprovalError";
  }
}

export function assertNotSelfApproval(requestedById: string, approverId: string): void {
  if (requestedById === approverId) throw new SelfApprovalError();
}

type ApprovalKind = {
  permission: Permission;
  onApproved: (payload: unknown, approver: CurrentUser) => Promise<void>;
  onRejected?: (payload: unknown, approver: CurrentUser) => Promise<void>;
};

// Apps register the kinds of approvals they need. The platform owns the queue,
// the four-eyes rule, and the audit trail.
const registry = new Map<string, ApprovalKind>();

export function registerApprovalKind(kind: string, def: ApprovalKind) {
  registry.set(kind, def);
}

export function approvalKindPermission(kind: string): Permission | undefined {
  return registry.get(kind)?.permission;
}

export function canDecideKind(user: { id: string; role: string }, req: { kind: string; requestedById: string }): boolean {
  const perm = approvalKindPermission(req.kind);
  return !!perm && can(user.role, "approvals:decide") && can(user.role, perm) && req.requestedById !== user.id;
}

export async function requestApproval(
  user: CurrentUser,
  input: { app: string; kind: string; entityType: string; entityId: string; summary: string; payload: unknown },
  tx: DbClient = db,
) {
  if (!registry.has(input.kind)) throw new Error(`Unknown approval kind ${input.kind}`);
  const req = await tx.approvalRequest.create({
    data: {
      app: input.app,
      kind: input.kind,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      payload: JSON.stringify(input.payload),
      requestedById: user.id,
      requestedByName: user.name,
    },
  });
  await recordAudit(user, {
    app: input.app,
    action: "approval.requested",
    entityType: "ApprovalRequest",
    entityId: req.id,
    after: { kind: input.kind, summary: input.summary, target: `${input.entityType}:${input.entityId}` },
  }, tx);
  return req;
}

export async function decideApproval(user: CurrentUser, id: string, decision: "approved" | "rejected", note: string) {
  const req = await db.approvalRequest.findUniqueOrThrow({ where: { id } });
  const def = registry.get(req.kind);
  if (!def) throw new Error(`Unknown approval kind ${req.kind}`);
  authorize(user, "approvals:decide");
  authorize(user, def.permission);
  assertNotSelfApproval(req.requestedById, user.id);
  if (req.status !== "pending") throw new Error("Request already decided");

  // Claim the request atomically so two approvers deciding at once cannot both
  // run the side effects; the first conditional update wins.
  const claimed = await db.approvalRequest.updateMany({
    where: { id, status: "pending" },
    data: { status: decision, decidedById: user.id, decidedByName: user.name, decisionNote: note, decidedAt: new Date() },
  });
  if (claimed.count === 0) throw new Error("Request already decided");

  const payload = JSON.parse(req.payload);
  if (decision === "approved") await def.onApproved(payload, user);
  else await def.onRejected?.(payload, user);

  const updated = await db.approvalRequest.findUniqueOrThrow({ where: { id } });
  await recordAudit(user, {
    app: req.app,
    action: `approval.${decision}`,
    entityType: "ApprovalRequest",
    entityId: id,
    before: { status: "pending" },
    after: { status: decision, note, requestedBy: req.requestedByName },
  });
  return updated;
}
