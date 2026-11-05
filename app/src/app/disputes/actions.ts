"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { authorize } from "@/platform/rbac";
import { recordAudit } from "@/platform/audit";
import { requestApproval } from "@/platform/approvals";
import { withFlash } from "@/platform/flash";
import { money } from "@/platform/ui";
import { needsWriteOffApproval } from "@/apps/disputes/rules";
import { DISPUTE_WRITE_OFF_KIND } from "@/apps/disputes/approvals";

const APP = "disputes";

export async function assignDispute(formData: FormData) {
  const id = String(formData.get("id"));
  return withFlash("/disputes", async () => {
    const user = await getCurrentUser();
    authorize(user, "disputes:work");
    const before = await db.chargeback.findUniqueOrThrow({ where: { id } });
    await db.chargeback.update({ where: { id }, data: { assigneeId: user.id, assigneeName: user.name } });
    await recordAudit(user, { app: APP, action: "dispute.assigned", entityType: "Chargeback", entityId: id, before: { assignee: before.assigneeName }, after: { assignee: user.name } });
    return `Assigned ${id} to you`;
  });
}

export async function submitEvidence(formData: FormData) {
  const id = String(formData.get("id"));
  const note = String(formData.get("note") ?? "").trim();
  return withFlash("/disputes", async () => {
    const user = await getCurrentUser();
    authorize(user, "disputes:work");
    if (!note) throw new Error("Describe the evidence submitted");
    const before = await db.chargeback.findUniqueOrThrow({ where: { id } });
    if (before.status !== "open") throw new Error(`Dispute is ${before.status}, not open`);
    await db.chargeback.update({ where: { id }, data: { status: "evidence_submitted", evidenceNote: note } });
    await recordAudit(user, { app: APP, action: "dispute.evidence_submitted", entityType: "Chargeback", entityId: id, before: { status: before.status }, after: { status: "evidence_submitted", note } });
    return `Evidence recorded for ${id}`;
  });
}

export async function recordOutcome(formData: FormData) {
  const id = String(formData.get("id"));
  const outcome = String(formData.get("outcome"));
  return withFlash("/disputes", async () => {
    const user = await getCurrentUser();
    authorize(user, "disputes:work");
    if (!["won", "lost"].includes(outcome)) throw new Error("Outcome must be won or lost");
    const before = await db.chargeback.findUniqueOrThrow({ where: { id } });
    if (before.status !== "evidence_submitted") throw new Error("Submit evidence before recording an outcome");
    await db.chargeback.update({ where: { id }, data: { status: outcome } });
    await recordAudit(user, { app: APP, action: `dispute.${outcome}`, entityType: "Chargeback", entityId: id, before: { status: before.status }, after: { status: outcome } });
    return `${id} marked ${outcome}`;
  });
}

export async function acceptLiability(formData: FormData) {
  const id = String(formData.get("id"));
  return withFlash("/disputes", async () => {
    const user = await getCurrentUser();
    authorize(user, "disputes:work");
    const cb = await db.chargeback.findUniqueOrThrow({ where: { id } });
    if (cb.status !== "open") throw new Error(`Dispute is ${cb.status}, not open`);
    if (needsWriteOffApproval(cb.amountCents)) {
      const req = await requestApproval(user, {
        app: APP, kind: DISPUTE_WRITE_OFF_KIND, entityType: "Chargeback", entityId: id,
        summary: `Accept chargeback ${id} for ${money(cb.amountCents)} (${cb.network} ${cb.reasonCode}, ${cb.customerName})`,
        payload: { chargebackId: id },
      });
      await db.chargeback.update({ where: { id }, data: { status: "pending_write_off", approvalId: req.id } });
      return `${id} is ${money(cb.amountCents)}; write-off sent to Finance for approval`;
    }
    await db.chargeback.update({ where: { id }, data: { status: "accepted" } });
    await recordAudit(user, { app: APP, action: "dispute.accepted", entityType: "Chargeback", entityId: id, before: { status: "open" }, after: { status: "accepted" } });
    return `${id} accepted (under threshold)`;
  });
}
