import { db } from "@/lib/db";
import { registerApprovalKind } from "@/platform/approvals";
import { recordAudit } from "@/platform/audit";

export const DISPUTE_WRITE_OFF_KIND = "dispute.write_off";

registerApprovalKind(DISPUTE_WRITE_OFF_KIND, {
  permission: "disputes:write_off",
  async onApproved(payload, approver) {
    const { chargebackId } = payload as { chargebackId: string };
    await db.chargeback.update({ where: { id: chargebackId }, data: { status: "accepted" } });
    await recordAudit(approver, { app: "disputes", action: "dispute.accepted", entityType: "Chargeback", entityId: chargebackId, before: { status: "pending_write_off" }, after: { status: "accepted" } });
  },
  async onRejected(payload, approver) {
    const { chargebackId } = payload as { chargebackId: string };
    await db.chargeback.update({ where: { id: chargebackId }, data: { status: "open" } });
    await recordAudit(approver, { app: "disputes", action: "dispute.write_off_rejected", entityType: "Chargeback", entityId: chargebackId, before: { status: "pending_write_off" }, after: { status: "open" } });
  },
});
