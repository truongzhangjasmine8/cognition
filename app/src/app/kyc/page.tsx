import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { Badge, PageHeader, Select, StatusBadge, Table, Td, Th, Stat, Button, FlashBanner } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { maskPII, riskTone } from "@/apps/kyc/pii";

const STATUSES = ["pending", "in_review", "escalated", "approved", "rejected"];

export default async function KycPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser("kyc:view");
  const status = typeof sp.status === "string" ? sp.status : "";
  const risk = typeof sp.risk === "string" ? sp.risk : "";
  const mine = sp.mine === "1";

  const where = {
    ...(status ? { status } : {}),
    ...(risk === "high" ? { riskScore: { gte: 70 } } : risk === "medium" ? { riskScore: { gte: 40, lt: 70 } } : risk === "low" ? { riskScore: { lt: 40 } } : {}),
    ...(mine ? { assigneeId: user.id } : {}),
  };
  const [rows, counts] = await Promise.all([
    db.kycApplicant.findMany({ where, orderBy: [{ riskScore: "desc" }, { createdAt: "asc" }] }),
    db.kycApplicant.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const applicants = rows.map((r) => maskPII(r, user.role));

  return (
    <>
      <PageHeader title="KYC Review Queue" subtitle="Applicants sorted by risk. PII is unmasked only for KYC analysts and Compliance." />
      <FlashBanner flash={readFlash(sp)} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Pending" value={count("pending")} />
        <Stat label="In review" value={count("in_review")} />
        <Stat label="Escalated" value={count("escalated")} hint="Needs Compliance" />
        <Stat label="Decided" value={count("approved") + count("rejected")} />
      </div>
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div className="w-44"><Select name="status" defaultValue={status}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</Select></div>
        <div className="w-40"><Select name="risk" defaultValue={risk}><option value="">All risk</option><option value="high">High (≥70)</option><option value="medium">Medium</option><option value="low">Low</option></Select></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="mine" value="1" defaultChecked={mine} /> Assigned to me</label>
        <Button variant="secondary">Filter</Button>
      </form>
      <Table head={<><Th>Applicant</Th><Th>Country</Th><Th>Email</Th><Th>National ID</Th><Th>Risk</Th><Th>Status</Th><Th>Assignee</Th></>} empty={applicants.length === 0}>
        {applicants.map((a) => (
          <tr key={a.id} className="hover:bg-slate-50">
            <Td><Link href={`/kyc/${a.id}`} className="font-medium text-slate-900 hover:underline">{a.fullName}</Link><div className="font-mono text-xs text-slate-500">{a.id}</div></Td>
            <Td>{a.country}</Td>
            <Td mono>{a.email}</Td>
            <Td mono>{a.nationalId}{a.piiMasked && <span className="ml-1 text-slate-400" title="Masked for your role">🔒</span>}</Td>
            <Td><Badge tone={riskTone(a.riskScore)}>{a.riskScore}</Badge></Td>
            <Td><StatusBadge status={a.status} /></Td>
            <Td className="text-slate-600">{a.assigneeName ?? "—"}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
