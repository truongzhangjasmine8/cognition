"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { authorize } from "@/platform/rbac";
import { withFlash } from "@/platform/flash";

// Demo only: edits a historical row directly in the database, the way a DBA or
// attacker with DB access would. The chain verification on the page catches it.
export async function simulateTamper() {
  return withFlash("/audit", async () => {
    if (process.env.NODE_ENV === "production") throw new Error("Disabled in production");
    const user = await getCurrentUser();
    authorize(user, "audit:view");
    const victim = await db.auditEvent.findFirst({ where: { action: { contains: "approved" } }, orderBy: { id: "asc" } });
    if (!victim) throw new Error("No approval event to tamper with yet");
    await db.auditEvent.update({ where: { id: victim.id }, data: { actorName: "Someone Else" } });
    return `Edited event #${victim.id} directly in the database (changed the actor). Watch the chain status.`;
  });
}

export async function resetTamper() {
  return withFlash("/audit", async () => {
    const user = await getCurrentUser();
    authorize(user, "audit:view");
    const victims = await db.auditEvent.findMany({ where: { actorName: "Someone Else" } });
    for (const v of victims) {
      const actor = await db.user.findUnique({ where: { id: v.actorId } });
      await db.auditEvent.update({ where: { id: v.id }, data: { actorName: actor?.name ?? v.actorName } });
    }
    return "Restored the edited rows";
  });
}
