import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo href={AUTH_ROUTES.afterLogin} />
        <LogoutButton />
      </Container>
    </header>
  );
}
