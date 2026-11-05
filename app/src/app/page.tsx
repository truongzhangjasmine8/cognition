import Link from "next/link";
import { getCurrentUser } from "@/platform/auth";
import { can, ROLE_LABELS, isRole } from "@/platform/rbac";
import { APPS } from "@/platform/apps";
import { Card, PageHeader, Badge } from "@/platform/ui";
import { db } from "@/lib/db";

export default async function Home() {
  const user = await getCurrentUser();
  const visible = APPS.filter((a) => can(user.role, a.permission));
  const hidden = APPS.length - visible.length;
  const pending = can(user.role, "approvals:view") ? await db.approvalRequest.count({ where: { status: "pending" } }) : null;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={`Signed in as ${isRole(user.role) ? ROLE_LABELS[user.role] : user.role}. You can see ${visible.length} of ${APPS.length} tools${hidden ? `; ${hidden} hidden by role` : ""}.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <Link key={a.slug} href={a.href} className="group">
            <Card className="h-full transition group-hover:border-slate-400">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{a.name}</h2>
                <Badge tone={a.kind === "platform" ? "blue" : "neutral"}>{a.kind}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{a.description}</p>
              {a.slug === "approvals" && pending !== null && (
                <p className="mt-3 text-sm font-medium text-amber-700">{pending} waiting</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
