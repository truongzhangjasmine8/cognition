import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { can } from "@/platform/rbac";
import { Badge, Button, Callout, Card, Field, FlashBanner, PageHeader, StatusBadge, Textarea, when } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { maskPII, riskTone } from "@/apps/kyc/pii";
import { assignToMe, decide } from "../actions";

export default async function ApplicantPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser("kyc:view");
  const raw = await db.kycApplicant.findUnique({ where: { id } });
  if (!raw) notFound();
  const a = maskPII(raw, user.role);
  const history = await db.auditEvent.findMany({ where: { entityType: "KycApplicant", entityId: id }, orderBy: { id: "desc" } });
  const decided = ["approved", "rejected"].includes(a.status);
  const canDecide = can(user.role, "kyc:decide") && !decided;
  const highRiskBlocked = a.riskScore >= 70 && !["compliance", "admin"].includes(user.role);

  return (
    <>
      <PageHeader title={a.fullName} subtitle={`${a.id} · submitted ${when(a.createdAt)}`} actions={<StatusBadge status={a.status} />} />
      <FlashBanner flash={readFlash(sp)} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-medium">Identity</h2>
            {a.piiMasked && <div className="mb-3"><Callout title="PII masked">Your role can see this case but not full identity data. Masking is applied on the server, so the data never reaches your browser.</Callout></div>}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-slate-500">Email</dt><dd className="font-mono">{a.email}</dd></div>
              <div><dt className="text-slate-500">Date of birth</dt><dd className="font-mono">{a.dateOfBirth}</dd></div>
              <div><dt className="text-slate-500">National ID</dt><dd className="font-mono">{a.nationalId}</dd></div>
              <div><dt className="text-slate-500">Country</dt><dd>{a.country}</dd></div>
              <div><dt className="text-slate-500">Risk score</dt><dd><Badge tone={riskTone(a.riskScore)}>{a.riskScore}</Badge></dd></div>
              <div><dt className="text-slate-500">Assignee</dt><dd>{a.assigneeName ?? "Unassigned"}</dd></div>
            </dl>
            {a.decisionNote && <p className="mt-4 text-sm"><span className="text-slate-500">Decision note:</span> {a.decisionNote}</p>}
          </Card>
          <Card>
            <h2 className="mb-3 font-medium">History</h2>
            {history.length === 0 && <p className="text-sm text-slate-500">No actions yet.</p>}
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
                  <div><span className="font-medium">{h.actorName}</span> <span className="text-slate-500">({h.actorRole})</span> · {h.action}{h.after && <div className="mt-0.5 font-mono text-xs text-slate-500">{h.after}</div>}</div>
                  <div className="shrink-0 text-xs text-slate-500">{when(h.createdAt)}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          {can(user.role, "kyc:assign") && !decided && a.assigneeId !== user.id && (
            <Card><form action={assignToMe}><input type="hidden" name="id" value={a.id} /><Button variant="secondary">Assign to me</Button></form></Card>
          )}
          {canDecide ? (
            <Card>
              <h2 className="mb-3 font-medium">Decision</h2>
              {highRiskBlocked && <div className="mb-3"><Callout title="High-risk applicant">Only Compliance can approve a score ≥ 70. You can still reject or escalate.</Callout></div>}
              <form action={decide} className="space-y-3">
                <input type="hidden" name="id" value={a.id} />
                <Field label="Reason" hint="Required. Recorded in the audit log."><Textarea name="note" required placeholder="e.g. Passport verified against sanctions list" /></Field>
                <div className="flex flex-wrap gap-2">
                  <Button name="decision" value="approved" disabled={highRiskBlocked} title={highRiskBlocked ? "Compliance only" : undefined}>Approve</Button>
                  <Button name="decision" value="rejected" variant="danger">Reject</Button>
                  <Button name="decision" value="escalated" variant="secondary">Escalate</Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card><p className="text-sm text-slate-600">{decided ? "This case is closed." : "Your role can view this case but not decide it."}</p></Card>
          )}
        </div>
      </div>
    </>
  );
}
