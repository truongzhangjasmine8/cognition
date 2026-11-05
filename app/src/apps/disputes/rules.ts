export const WRITE_OFF_APPROVAL_THRESHOLD_CENTS = 50_000; // $500

export function needsWriteOffApproval(amountCents: number): boolean {
  return amountCents >= WRITE_OFF_APPROVAL_THRESHOLD_CENTS;
}

export function deadlineState(dueBy: Date, now = new Date()): "overdue" | "due_soon" | "ok" {
  const days = (dueBy.getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return "overdue";
  if (days <= 3) return "due_soon";
  return "ok";
}
