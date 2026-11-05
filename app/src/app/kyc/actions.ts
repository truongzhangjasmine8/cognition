"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { authorize } from "@/platform/rbac";
import { recordAudit } from "@/platform/audit";
import { withFlash } from "@/platform/flash";

const APP = "kyc";

export async function assignToMe(formData: FormData) {
  const id = String(formData.get("id"));
  return withFlash(`/kyc/${id}`, async () => {
    const user = await getCurrentUser();
    authorize(user, "kyc:assign");
    const before = await db.kycApplicant.findUniqueOrThrow({ where: { id } });
    if (["approved", "rejected"].includes(before.status)) throw new Error(`Applicant is already ${before.status}; closed cases cannot be reassigned`);
    const after = await db.kycApplicant.update({
      where: { id },
      data: { assigneeId: user.id, assigneeName: user.name, status: before.status === "pending" ? "in_review" : before.status },
    });
    await recordAudit(user, {
      app: APP, action: "kyc.assigned", entityType: "KycApplicant", entityId: id,
      before: { assignee: before.assigneeName, status: before.status },
      after: { assignee: after.assigneeName, status: after.status },
    });
    return `Assigned ${id} to you`;
  });
}

export async function decide(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") ?? "").trim();
  return withFlash(`/kyc/${id}`, async () => {
    const user = await getCurrentUser();
    authorize(user, "kyc:decide");
    if (!["approved", "rejected", "escalated"].includes(decision)) throw new Error("Invalid decision");
    if (!note) throw new Error("A reason is required for every decision");
    const before = await db.kycApplicant.findUniqueOrThrow({ where: { id } });
    if (["approved", "rejected"].includes(before.status)) throw new Error(`Applicant is already ${before.status}`);
    if (before.riskScore >= 70 && decision === "approved" && user.role !== "compliance" && user.role !== "admin") {
      throw new Error("High-risk applicants (score ≥ 70) can only be approved by Compliance");
    }
    const after = await db.kycApplicant.update({ where: { id }, data: { status: decision, decisionNote: note } });
    await recordAudit(user, {
      app: APP, action: `kyc.${decision}`, entityType: "KycApplicant", entityId: id,
      before: { status: before.status, riskScore: before.riskScore },
      after: { status: after.status, note },
    });
    return `${id} ${decision}`;
  });
}
