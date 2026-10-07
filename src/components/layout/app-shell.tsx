import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/layout/logo";
import { DesktopSidebar, MobileNavButton } from "@/components/layout/sidebar";
import { UserNav, UserNavFallback, UserNavSkeleton } from "@/components/layout/user-nav";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

/**
 * Authenticated application frame: sidebar + top bar + content. The frame is
 * static; only the user area streams in (it reads the session).
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileNavButton footer={<LogoutButton />} />
            <Logo href={AUTH_ROUTES.afterLogin} compact />
          </div>
          <div className="hidden lg:block" />
          <ErrorBoundary fallback={<UserNavFallback />}>
            <Suspense fallback={<UserNavSkeleton />}>
              <UserNav />
            </Suspense>
          </ErrorBoundary>
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Primary page actions, aligned right on larger screens. */
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
