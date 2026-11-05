import { db } from "@/lib/db";
import { requireUser } from "@/platform/guard";
import { can } from "@/platform/rbac";
import { Badge, Button, Callout, Card, FlashBanner, PageHeader, Table, Td, Th } from "@/platform/ui";
import { readFlash } from "@/platform/flash";
import { ENVIRONMENTS } from "@/apps/flags/sdk";
import { updateFlag } from "./actions";

export default async function FlagsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("flags:view");
  const sp = await searchParams;
  const flags = await db.featureFlag.findMany({ include: { environments: true }, orderBy: { key: "asc" } });
  const pendingProd = await db.approvalRequest.findMany({ where: { kind: "flag.prod_change", status: "pending" } });
  const canEdit = can(user.role, "flags:edit_nonprod");
  const canRequestProd = can(user.role, "flags:request_prod");

  return (
    <>
      <PageHeader title="Feature Flags" subtitle="Dev and staging changes apply immediately. Production changes go through an approval and are applied by the platform, not by the requester." />
      <FlashBanner flash={readFlash(sp)} />
      <div className="space-y-6">
        <Table head={<><Th>Flag</Th>{ENVIRONMENTS.map((e) => <Th key={e}>{e}</Th>)}</>} empty={flags.length === 0}>
          {flags.map((f) => (
            <tr key={f.id} className="align-top">
              <Td><div className="font-mono text-sm font-medium">{f.key}</div><div className="text-xs text-slate-500">{f.description}</div></Td>
              {ENVIRONMENTS.map((env) => {
                const s = f.environments.find((e) => e.env === env);
                if (!s) return <Td key={env}>—</Td>;
                const pending = pendingProd.find((p) => p.entityId === f.key);
                const editable = env === "prod" ? canRequestProd : canEdit;
                return (
                  <Td key={env}>
                    <form action={updateFlag} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="flagId" value={f.id} />
                      <input type="hidden" name="env" value={env} />
                      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" name="enabled" defaultChecked={s.enabled} disabled={!editable} /> on</label>
                      <input type="number" name="rolloutPct" min={0} max={100} defaultValue={s.rolloutPct} disabled={!editable} className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-xs" aria-label="rollout percent" />
                      <span className="text-xs text-slate-500">%</span>
                      {editable && <Button size="sm" variant="secondary">{env === "prod" ? "Request" : "Save"}</Button>}
                    </form>
                    {env === "prod" && pending && <div className="mt-1"><Badge tone="amber">change pending approval</Badge></div>}
                  </Td>
                );
              })}
            </tr>
          ))}
        </Table>
        <Card>
          <h2 className="mb-2 font-medium">SDK endpoint</h2>
          <p className="text-sm text-slate-600">Product services evaluate flags over HTTP with sticky percentage bucketing by user. Something a Dataverse-backed Power App can&apos;t serve in a hot path.</p>
          <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">{`curl "http://localhost:3000/api/flags/evaluate?key=instant_payouts&env=prod&subject=user_42" \\
  -H "x-api-key: demo-sdk-key"
# → {"key":"instant_payouts","env":"prod","enabled":true,"rolloutPct":25,"subject":"user_42"}`}</pre>
        </Card>
        {!canEdit && !canRequestProd && <Callout title="Read-only">Your role can see flags but not change them.</Callout>}
      </div>
    </>
  );
}
