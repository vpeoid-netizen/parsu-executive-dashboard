import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { getCurrentAdmin } from "@/lib/auth";
import { adminNavigation } from "@/lib/navigation";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-white p-4 md:block">
          <p className="font-display text-sm font-semibold tracking-tight text-navy-900">ParSU Admin</p>
          <p className="mt-1 text-xs text-muted-foreground">{admin.email}</p>
          <nav className="mt-6 space-y-0.5" aria-label="Administration">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-3 py-2 text-sm text-navy-800 hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-8">
            <button className="text-sm text-muted-foreground hover:text-navy-900">Sign out</button>
          </form>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3 md:hidden">
            <p className="font-semibold text-navy-900">ParSU Admin</p>
            <form action={logoutAction}>
              <button className="text-sm">Sign out</button>
            </form>
          </header>
          <div className="p-4 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
