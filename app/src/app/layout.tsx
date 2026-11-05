import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/platform/auth";
import { can, ROLE_LABELS, isRole } from "@/platform/rbac";
import { APPS } from "@/platform/apps";
import { switchUser } from "@/platform/actions";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Acme Fin · Internal Tools",
  description: "Internal tools platform prototype",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, users] = await Promise.all([getCurrentUser(), db.user.findMany({ orderBy: { id: "asc" } })]);
  const visible = APPS.filter((a) => can(user.role, a.permission));
  const roleLabel = isRole(user.role) ? ROLE_LABELS[user.role] : user.role;

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
            <Link href="/" className="flex items-center gap-2 px-5 py-4 text-sm font-semibold">
              <span className="inline-block h-6 w-6 rounded bg-slate-900" />
              Acme Fin Tools
            </Link>
            <nav className="flex-1 space-y-4 px-3 py-2 text-sm">
              <div>
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Apps</div>
                {visible.filter((a) => a.kind === "app").map((a) => (
                  <Link key={a.slug} href={a.href} className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    {a.name}
                  </Link>
                ))}
              </div>
              <div>
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Platform</div>
                {visible.filter((a) => a.kind === "platform").map((a) => (
                  <Link key={a.slug} href={a.href} className="block rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100">
                    {a.name}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
              <div className="font-medium text-slate-700">{user.name}</div>
              <div>{roleLabel}</div>
              <form action={switchUser} className="mt-2">
                <select
                  name="userId"
                  defaultValue={user.id}
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  aria-label="Switch demo user"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {isRole(u.role) ? ROLE_LABELS[u.role] : u.role}
                    </option>
                  ))}
                </select>
                <button className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50">
                  Switch user (demo SSO)
                </button>
              </form>
            </div>
          </aside>
          <main className="min-w-0 flex-1 px-8 py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
