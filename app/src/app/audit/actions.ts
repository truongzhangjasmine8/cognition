"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { authorize } from "@/platform/rbac";
import { withFlash } from "@/platform/flash";
import { DEMO_AUTH_ENABLED } from "@/platform/auth";

function assertDemoMode() {
  if (!DEMO_AUTH_ENABLED) throw new Error("Disabled outside demo mode");
}

// Demo only: edits a historical row directly in the database, the way a DBA or
// attacker with DB access would. The chain verification on the page catches it.
export async function simulateTamper() {
  return withFlash("/audit", async () => {
    assertDemoMode();
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
    assertDemoMode();
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
