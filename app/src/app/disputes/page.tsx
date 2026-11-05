import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { can } from "@/platform/rbac";
import { Badge, Button, FlashBanner, Input, PageHeader, Select, Stat, StatusBadge, Table, Td, Th, money, when } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { deadlineState, WRITE_OFF_APPROVAL_THRESHOLD_CENTS } from "@/apps/disputes/rules";
import { acceptLiability, assignDispute, recordOutcome, submitEvidence } from "./actions";

const STATUSES = ["open", "evidence_submitted", "pending_write_off", "won", "lost", "accepted"];

export default async function DisputesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("disputes:view");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const rows = await db.chargeback.findMany({ where: status ? { status } : {}, orderBy: { dueBy: "asc" } });
  const all = status ? await db.chargeback.findMany() : rows;
  const canWork = can(user.role, "disputes:work");
  const open = all.filter((c) => ["open", "evidence_submitted", "pending_write_off"].includes(c.status));
  const overdue = open.filter((c) => deadlineState(c.dueBy) === "overdue").length;
  const sum = (s: string) => all.filter((c) => c.status === s).reduce((t, c) => t + c.amountCents, 0);

  return (
    <>
      <PageHeader title="Chargeback Disputes" subtitle={`Work disputes before the network deadline. Accepting a chargeback of ${money(WRITE_OFF_APPROVAL_THRESHOLD_CENTS)} or more needs Finance approval.`} />
      <FlashBanner flash={readFlash(sp)} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Open" value={open.length} hint={`${money(open.reduce((t, c) => t + c.amountCents, 0))} at stake`} />
        <Stat label="Overdue" value={overdue} hint="Past network deadline" />
        <Stat label="Won" value={money(sum("won"))} />
        <Stat label="Lost + accepted" value={money(sum("lost") + sum("accepted"))} />
      </div>
      <form method="get" className="mb-4 flex items-end gap-3">
        <div className="w-48"><Select name="status" defaultValue={status}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</Select></div>
        <Button variant="secondary">Filter</Button>
      </form>
      <Table head={<><Th>Dispute</Th><Th>Customer</Th><Th className="text-right">Amount</Th><Th>Reason</Th><Th>Due</Th><Th>Status</Th><Th>Assignee</Th><Th>Actions</Th></>} empty={rows.length === 0}>
        {rows.map((c) => {
          const d = deadlineState(c.dueBy);
          const active = ["open", "evidence_submitted"].includes(c.status);
          return (
            <tr key={c.id} className="align-top hover:bg-slate-50">
              <Td><div className="font-mono text-sm font-medium">{c.id}</div><div className="text-xs text-slate-500">{c.orderId} · {c.network}</div></Td>
              <Td>{c.customerName}</Td>
              <Td className="text-right font-medium">{money(c.amountCents, c.currency)}</Td>
              <Td className="text-slate-600">{c.reasonCode}</Td>
              <Td>
                <div className="text-slate-600">{when(c.dueBy)}</div>
                {active && d !== "ok" && <Badge tone={d === "overdue" ? "red" : "amber"}>{d === "overdue" ? "overdue" : "due soon"}</Badge>}
              </Td>
              <Td><StatusBadge status={c.status} />{c.evidenceNote && <div className="mt-1 max-w-[12rem] text-xs text-slate-500">{c.evidenceNote}</div>}</Td>
              <Td className="text-slate-600">{c.assigneeName ?? "—"}</Td>
              <Td>
                {canWork && active && (
                  <div className="flex flex-col gap-1.5">
                    {c.assigneeId !== user.id && <form action={assignDispute}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="secondary">Assign to me</Button></form>}
                    {c.status === "open" && (
                      <>
                        <form action={submitEvidence} className="flex gap-1"><input type="hidden" name="id" value={c.id} /><div className="w-40"><Input name="note" placeholder="Evidence summary" required /></div><Button size="sm" variant="secondary">Submit</Button></form>
                        <form action={acceptLiability}><input type="hidden" name="id" value={c.id} /><Button size="sm" variant="danger">Accept liability</Button></form>
                      </>
                    )}
                    {c.status === "evidence_submitted" && (
                      <form action={recordOutcome} className="flex gap-1"><input type="hidden" name="id" value={c.id} /><Button size="sm" name="outcome" value="won">Won</Button><Button size="sm" name="outcome" value="lost" variant="danger">Lost</Button></form>
                    )}
                  </div>
                )}
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
