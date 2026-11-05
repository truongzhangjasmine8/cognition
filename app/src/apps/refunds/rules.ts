export const REFUND_APPROVAL_THRESHOLD_CENTS = 50_000; // $500

export function needsSecondApprover(amountCents: number): boolean {
  return amountCents >= REFUND_APPROVAL_THRESHOLD_CENTS;
}
