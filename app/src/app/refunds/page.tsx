import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { can } from "@/platform/rbac";
import { Button, Callout, Card, Field, FlashBanner, Input, PageHeader, Stat, StatusBadge, Table, Td, Th, money, when } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { REFUND_APPROVAL_THRESHOLD_CENTS } from "@/apps/refunds/rules";
import { markProcessed, requestRefund } from "./actions";

export default async function RefundsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("refunds:view");
  const sp = await searchParams;
  const refunds = await db.refund.findMany({ orderBy: { createdAt: "desc" } });
  const sum = (s: string) => refunds.filter((r) => r.status === s).reduce((t, r) => t + r.amountCents, 0);
  const count = (s: string) => refunds.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader title="Refunds" subtitle={`Refunds of ${money(REFUND_APPROVAL_THRESHOLD_CENTS)} or more need a second approver (finance manager or admin), and never the requester.`} />
      <FlashBanner flash={readFlash(sp)} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Awaiting approval" value={money(sum("pending_approval"))} hint={`${count("pending_approval")} refunds`} />
        <Stat label="Approved" value={money(sum("approved"))} hint={`${count("approved")} ready to process`} />
        <Stat label="Processed" value={money(sum("processed"))} hint={`${count("processed")} refunds`} />
        <Stat label="Rejected" value={money(sum("rejected"))} hint={`${count("rejected")} refunds`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table head={<><Th>Refund</Th><Th>Customer</Th><Th className="text-right">Amount</Th><Th>Reason</Th><Th>Requested by</Th><Th>Status</Th><Th></Th></>} empty={refunds.length === 0}>
            {refunds.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <Td><div className="font-mono text-xs">{r.id}</div><div className="text-xs text-slate-500">{r.orderId} · {when(r.createdAt)}</div></Td>
                <Td>{r.customerName}</Td>
                <Td className="text-right font-medium">{money(r.amountCents, r.currency)}</Td>
                <Td className="text-slate-600">{r.reason}</Td>
                <Td className="text-slate-600">{r.requestedByName}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td>
                  {r.status === "approved" && can(user.role, "refunds:approve") && (
                    <form action={markProcessed}><input type="hidden" name="id" value={r.id} /><Button size="sm" variant="secondary">Process</Button></form>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </div>
        <div>
          {can(user.role, "refunds:request") ? (
            <Card>
              <h2 className="mb-3 font-medium">Request a refund</h2>
              <form action={requestRefund} className="space-y-3">
                <Field label="Order ID"><Input name="orderId" required placeholder="ORD-55123" /></Field>
                <Field label="Customer"><Input name="customerName" required placeholder="Jane Doe" /></Field>
                <Field label="Amount (USD)" hint={`≥ ${money(REFUND_APPROVAL_THRESHOLD_CENTS)} goes to the approval queue`}><Input name="amount" type="number" step="0.01" min="0.01" required placeholder="120.00" /></Field>
                <Field label="Reason"><Input name="reason" required placeholder="Duplicate charge" /></Field>
                <Button>Submit</Button>
              </form>
            </Card>
          ) : (
            <Callout title="Read-only">Your role can see refunds but not request them.</Callout>
          )}
        </div>
      </div>
    </>
  );
}
