import { AppShell } from "@/components/layout/app-shell";

/**
 * Shell for authenticated pages. It stays static so it renders instantly;
 * each page verifies the user via the Data Access Layer inside <Suspense>.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
