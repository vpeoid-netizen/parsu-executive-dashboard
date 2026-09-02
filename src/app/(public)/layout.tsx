import { DashboardChat } from "@/components/chat/dashboard-chat";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="main-content" className="min-w-0 flex-1">
        {children}
      </main>
      <SiteFooter />
      <DashboardChat />
    </div>
  );
}
