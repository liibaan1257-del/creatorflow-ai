import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Container className="space-y-6">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </Container>
  );
}

async function DashboardContent() {
  const [user, profile] = await Promise.all([requireUser(), getCurrentProfile()]);
  const name = profile?.full_name?.trim();
  const memberSince = profile
    ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
        new Date(profile.created_at),
      )
    : null;

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {name ? `Welcome, ${name}` : "Welcome"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your content workspace is ready. AI tools are coming next.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium break-all">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Member since</dt>
            <dd className="mt-1 font-medium">{memberSince ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-border" />
      <div className="h-32 rounded-xl bg-border" />
    </div>
  );
}
