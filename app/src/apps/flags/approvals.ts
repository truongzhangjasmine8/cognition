import { db } from "@/lib/db";
import { registerApprovalKind } from "@/platform/approvals";
import { recordAudit } from "@/platform/audit";

export const FLAG_PROD_CHANGE_KIND = "flag.prod_change";

export type FlagChangePayload = { flagId: string; flagKey: string; env: string; enabled: boolean; rolloutPct: number };

registerApprovalKind(FLAG_PROD_CHANGE_KIND, {
  permission: "flags:approve_prod",
  async onApproved(payload, approver) {
    const p = payload as FlagChangePayload;
    const before = await db.flagEnvironment.findUniqueOrThrow({ where: { flagId_env: { flagId: p.flagId, env: p.env } } });
    await db.flagEnvironment.update({ where: { id: before.id }, data: { enabled: p.enabled, rolloutPct: p.rolloutPct } });
    await recordAudit(approver, {
      app: "flags", action: "flag.changed", entityType: "FeatureFlag", entityId: p.flagKey,
      before: { env: p.env, enabled: before.enabled, rolloutPct: before.rolloutPct },
      after: { env: p.env, enabled: p.enabled, rolloutPct: p.rolloutPct, approved: true },
    });
  },
});
