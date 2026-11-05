"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { authorize } from "@/platform/rbac";
import { recordAudit } from "@/platform/audit";
import { requestApproval } from "@/platform/approvals";
import { withFlash } from "@/platform/flash";
import { isEnv } from "@/apps/flags/sdk";
import { FLAG_PROD_CHANGE_KIND } from "@/apps/flags/approvals";

export async function updateFlag(formData: FormData) {
  return withFlash("/flags", async () => {
    const user = await getCurrentUser();
    const flagId = String(formData.get("flagId"));
    const env = String(formData.get("env"));
    const enabled = formData.get("enabled") === "on";
    const rolloutPct = Math.min(100, Math.max(0, Number(formData.get("rolloutPct") ?? 100)));
    if (!isEnv(env)) throw new Error("Unknown environment");

    const flag = await db.featureFlag.findUniqueOrThrow({ where: { id: flagId } });
    const state = await db.flagEnvironment.findUniqueOrThrow({ where: { flagId_env: { flagId, env } } });
    const label = `${flag.key} in ${env}: ${enabled ? `on at ${rolloutPct}%` : "off"}`;

    if (env === "prod") {
      authorize(user, "flags:request_prod");
      await requestApproval(user, {
        app: "flags", kind: FLAG_PROD_CHANGE_KIND, entityType: "FeatureFlag", entityId: flag.key,
        summary: `Set ${label} (currently ${state.enabled ? `on at ${state.rolloutPct}%` : "off"})`,
        payload: { flagId, flagKey: flag.key, env, enabled, rolloutPct },
      });
      return `Production change for ${flag.key} sent for approval`;
    }

    authorize(user, "flags:edit_nonprod");
    await db.flagEnvironment.update({ where: { id: state.id }, data: { enabled, rolloutPct } });
    await recordAudit(user, {
      app: "flags", action: "flag.changed", entityType: "FeatureFlag", entityId: flag.key,
      before: { env, enabled: state.enabled, rolloutPct: state.rolloutPct },
      after: { env, enabled, rolloutPct },
    });
    return `Updated ${label}`;
  });
}
