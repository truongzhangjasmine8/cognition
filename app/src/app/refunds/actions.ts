"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { authorize } from "@/platform/rbac";
import { recordAudit } from "@/platform/audit";
import { requestApproval } from "@/platform/approvals";
import { withFlash } from "@/platform/flash";
import { needsSecondApprover } from "@/apps/refunds/rules";
import { REFUND_APPROVAL_KIND } from "@/apps/refunds/approvals";
import { money } from "@/platform/ui";

export async function requestRefund(formData: FormData) {
  return withFlash("/refunds", async () => {
    const user = await getCurrentUser();
    authorize(user, "refunds:request");
    const amount = Math.round(Number(formData.get("amount")) * 100);
    const orderId = String(formData.get("orderId") ?? "").trim();
    const customerName = String(formData.get("customerName") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    if (!orderId || !customerName || !reason) throw new Error("Order, customer and reason are required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be positive");

    const large = needsSecondApprover(amount);
    // Refund, approval request and audit events commit together or not at all.
    await db.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          orderId, customerName, reason, amountCents: amount,
          customerEmail: `${customerName.split(" ")[0].toLowerCase()}@mail.example`,
          status: large ? "pending_approval" : "approved",
          requestedById: user.id, requestedByName: user.name,
        },
      });
      await recordAudit(user, { app: "refunds", action: "refund.requested", entityType: "Refund", entityId: refund.id, after: { orderId, amountCents: amount, status: refund.status } }, tx);
      if (large) {
        const req = await requestApproval(user, {
          app: "refunds", kind: REFUND_APPROVAL_KIND, entityType: "Refund", entityId: refund.id,
          summary: `Refund ${money(amount)} to ${customerName} (order ${orderId}): ${reason}`,
          payload: { refundId: refund.id },
        }, tx);
        await tx.refund.update({ where: { id: refund.id }, data: { approvalId: req.id } });
      }
    });
    return large
      ? `Refund of ${money(amount)} submitted. It needs a second approver because it is over the threshold.`
      : `Refund of ${money(amount)} approved automatically (under threshold).`;
  });
}

export async function markProcessed(formData: FormData) {
  const id = String(formData.get("id"));
  return withFlash("/refunds", async () => {
    const user = await getCurrentUser();
    authorize(user, "refunds:approve");
    const before = await db.refund.findUniqueOrThrow({ where: { id } });
    if (before.status !== "approved") throw new Error("Only approved refunds can be processed");
    await db.refund.update({ where: { id }, data: { status: "processed" } });
    await recordAudit(user, { app: "refunds", action: "refund.processed", entityType: "Refund", entityId: id, before: { status: "approved" }, after: { status: "processed" } });
    return `${id} marked as processed`;
  });
}
