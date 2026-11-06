import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { can } from "@/platform/rbac";
import { recordAudit } from "@/platform/audit";

export function csv(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Spreadsheets treat leading = + - @ (and tab/CR) as formulas; prefix with a quote so they stay text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!can(user.role, "audit:export")) return new Response("forbidden", { status: 403 });
  const app = new URL(request.url).searchParams.get("app") ?? "";
  const events = await db.auditEvent.findMany({ where: app ? { app } : {}, orderBy: { id: "asc" } });
  // Exporting is itself an audited action.
  await recordAudit(user, { app: "platform", action: "audit.exported", entityType: "AuditLog", entityId: app || "all", after: { rows: events.length } });

  const header = ["id", "createdAt", "actorId", "actorName", "actorRole", "app", "action", "entityType", "entityId", "before", "after", "prevHash", "hash"];
  const lines = [header.join(",")];
  for (const e of events) lines.push(header.map((h) => csv((e as Record<string, unknown>)[h] instanceof Date ? (e.createdAt as Date).toISOString() : (e as Record<string, unknown>)[h])).join(","));
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="audit-${app || "all"}-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
