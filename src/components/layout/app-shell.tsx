import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { LogoutButton } from "@/features/auth/components/logout-button";

/** Authenticated application frame: sidebar navigation + scrollable content. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <Sidebar footer={<LogoutButton />} />
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
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
