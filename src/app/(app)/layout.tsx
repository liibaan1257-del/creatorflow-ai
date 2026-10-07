import { AppHeader } from "@/components/layout/app-header";

/**
 * Shell for authenticated pages. It stays static so it renders instantly;
 * each page verifies the user via the Data Access Layer inside <Suspense>.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader />
      <main className="flex-1 bg-muted py-8 sm:py-12">{children}</main>
    </>
  );
}
