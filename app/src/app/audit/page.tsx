import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { can } from "@/platform/rbac";
import { verifyAuditChain } from "@/platform/audit";
import { DEMO_AUTH_ENABLED } from "@/platform/auth";
import { Badge, Button, FlashBanner, LinkButton, PageHeader, Select, Table, Td, Th, when } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { resetTamper, simulateTamper } from "./actions";

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("audit:view");
  const sp = await searchParams;
  const app = typeof sp.app === "string" ? sp.app : "";
  const [events, chain, apps] = await Promise.all([
    db.auditEvent.findMany({ where: app ? { app } : {}, orderBy: { id: "desc" }, take: 100 }),
    verifyAuditChain(),
    db.auditEvent.findMany({ distinct: ["app"], select: { app: true } }),
  ]);
  const exportHref = `/audit/export${app ? `?app=${app}` : ""}`;

  return (
    <>
      <PageHeader
        title="Audit Log"
        subtitle="Every action in every app, written by the platform. Each event is hashed with the previous one, so edits to history are detectable."
        actions={can(user.role, "audit:export") ? <LinkButton href={exportHref}>Export CSV</LinkButton> : undefined}
      />
      <FlashBanner flash={readFlash(sp)} />
      <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${chain.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-300 bg-rose-50 text-rose-900"}`}>
        <div>
          <span className="font-medium">Chain integrity: {chain.ok ? "verified" : "BROKEN"}</span>
          <span className="ml-2 text-xs opacity-80">{chain.count} events checked{!chain.ok && ` · first bad event #${chain.brokenAtId} (${chain.reason})`}</span>
        </div>
        {DEMO_AUTH_ENABLED && (
          <div className="flex gap-2">
            <form action={simulateTamper}><Button size="sm" variant="secondary">Demo: tamper with a row</Button></form>
            {!chain.ok && <form action={resetTamper}><Button size="sm" variant="secondary">Restore</Button></form>}
          </div>
        )}
      </div>
      <form method="get" className="mb-4 flex items-end gap-3">
        <div className="w-44"><Select name="app" defaultValue={app}><option value="">All apps</option>{apps.map((a) => <option key={a.app} value={a.app}>{a.app}</option>)}</Select></div>
        <Button variant="secondary">Filter</Button>
      </form>
      <Table head={<><Th>#</Th><Th>When</Th><Th>Actor</Th><Th>App</Th><Th>Action</Th><Th>Entity</Th><Th>Change</Th><Th>Hash</Th></>} empty={events.length === 0}>
        {events.map((e) => (
          <tr key={e.id} className="align-top">
            <Td mono>{e.id}</Td>
            <Td className="whitespace-nowrap text-slate-600">{when(e.createdAt)}</Td>
            <Td>{e.actorName}<div className="text-xs text-slate-500">{e.actorRole}</div></Td>
            <Td><Badge tone="blue">{e.app}</Badge></Td>
            <Td mono>{e.action}</Td>
            <Td mono>{e.entityType}<div className="text-slate-500">{e.entityId}</div></Td>
            <Td mono><div className="min-w-[14rem] max-w-md break-all text-slate-600">{e.before && <div className="text-rose-700">− {e.before}</div>}{e.after && <div className="text-emerald-700">+ {e.after}</div>}</div></Td>
            <Td mono><span title={e.hash} className="text-slate-400">{e.hash.slice(0, 10)}…</span></Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
