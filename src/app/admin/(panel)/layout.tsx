import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-white p-4 shadow-[inset_-1px_0_0_rgba(247,185,24,0.7)] md:block">
          <p className="font-display text-sm font-semibold tracking-tight text-navy-900">ParSU Admin</p>
          <Link href="/admin/account" className="mt-1 block text-xs text-muted-foreground hover:text-navy-900">
            {admin.email}
          </Link>
          <AdminNav variant="side" />
          <form action={logoutAction} className="mt-8">
            <button className="btn btn-ghost">Sign out</button>
          </form>
        </aside>
        <div className="flex-1">
          <header className="border-b border-border bg-white md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/admin/account" className="font-semibold text-navy-900">
                ParSU Admin
              </Link>
              <form action={logoutAction}>
                <button className="text-sm">Sign out</button>
              </form>
            </div>
            <AdminNav variant="mobile" />
          </header>
          <div className="p-4 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
