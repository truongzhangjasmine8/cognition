"use server";

import "@/platform/approval-kinds";
import { getCurrentUser } from "@/platform/auth";
import { decideApproval } from "@/platform/approvals";
import { withFlash } from "@/platform/flash";

export async function decideAction(formData: FormData) {
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision")) === "approved" ? "approved" : "rejected";
  const note = String(formData.get("note") ?? "").trim();
  return withFlash("/approvals", async () => {
    const user = await getCurrentUser();
    await decideApproval(user, id, decision, note);
    return `Request ${decision}`;
  });
}
