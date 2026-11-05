import { db } from "@/lib/db";
import { registerApprovalKind } from "@/platform/approvals";
import { recordAudit } from "@/platform/audit";

export const REFUND_APPROVAL_KIND = "refund.large";

registerApprovalKind(REFUND_APPROVAL_KIND, {
  permission: "refunds:approve",
  async onApproved(payload, approver) {
    const { refundId } = payload as { refundId: string };
    await db.refund.update({ where: { id: refundId }, data: { status: "approved" } });
    await recordAudit(approver, { app: "refunds", action: "refund.approved", entityType: "Refund", entityId: refundId, before: { status: "pending_approval" }, after: { status: "approved" } });
  },
  async onRejected(payload, approver) {
    const { refundId } = payload as { refundId: string };
    await db.refund.update({ where: { id: refundId }, data: { status: "rejected" } });
    await recordAudit(approver, { app: "refunds", action: "refund.rejected", entityType: "Refund", entityId: refundId, before: { status: "pending_approval" }, after: { status: "rejected" } });
  },
});
