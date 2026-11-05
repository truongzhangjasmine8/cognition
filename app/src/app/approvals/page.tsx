import "@/platform/approval-kinds";
import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { can } from "@/platform/rbac";
import { Badge, Button, Callout, FlashBanner, Input, PageHeader, StatusBadge, Table, Td, Th, when } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { decideAction } from "./actions";

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("approvals:view");
  const [pending, recent] = await Promise.all([
    db.approvalRequest.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" } }),
    db.approvalRequest.findMany({ where: { status: { not: "pending" } }, orderBy: { decidedAt: "desc" }, take: 10 }),
  ]);
  const canDecide = can(user.role, "approvals:decide");

  return (
    <>
      <PageHeader title="Approvals" subtitle="One queue for every app. The platform enforces that the approver has the right permission and is not the requester." />
      <FlashBanner flash={readFlash(sp)} />
      {!canDecide && <div className="mb-4"><Callout title="View only">Your role can see the queue but not decide. Finance managers approve refunds; admins approve production flag changes.</Callout></div>}
      <h2 className="mb-2 text-sm font-medium text-slate-600">Pending ({pending.length})</h2>
      <Table head={<><Th>App</Th><Th>Request</Th><Th>Requested by</Th><Th>When</Th><Th>Decision</Th></>} empty={pending.length === 0}>
        {pending.map((r) => {
          const self = r.requestedById === user.id;
          return (
            <tr key={r.id} className="align-top">
              <Td><Badge tone="blue">{r.app}</Badge><div className="mt-1 font-mono text-xs text-slate-500">{r.kind}</div></Td>
              <Td>{r.summary}</Td>
              <Td className="text-slate-600">{r.requestedByName}{self && <Badge tone="amber">you</Badge>}</Td>
              <Td className="text-slate-600">{when(r.createdAt)}</Td>
              <Td>
                {canDecide ? (
                  <form action={decideAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <div className="w-44"><Input name="note" placeholder="Note (optional)" /></div>
                    <Button size="sm" name="decision" value="approved" disabled={self} title={self ? "You cannot approve your own request" : undefined}>Approve</Button>
                    <Button size="sm" name="decision" value="rejected" variant="danger" disabled={self}>Reject</Button>
                  </form>
                ) : <span className="text-xs text-slate-400">—</span>}
              </Td>
            </tr>
          );
        })}
      </Table>
      <h2 className="mb-2 mt-8 text-sm font-medium text-slate-600">Recently decided</h2>
      <Table head={<><Th>App</Th><Th>Request</Th><Th>Requested by</Th><Th>Decided by</Th><Th>Outcome</Th></>} empty={recent.length === 0}>
        {recent.map((r) => (
          <tr key={r.id}>
            <Td><Badge tone="blue">{r.app}</Badge></Td>
            <Td>{r.summary}</Td>
            <Td className="text-slate-600">{r.requestedByName}</Td>
            <Td className="text-slate-600">{r.decidedByName}<div className="text-xs text-slate-400">{r.decidedAt && when(r.decidedAt)}</div></Td>
            <Td><StatusBadge status={r.status} />{r.decisionNote && <div className="mt-1 text-xs text-slate-500">{r.decisionNote}</div>}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
