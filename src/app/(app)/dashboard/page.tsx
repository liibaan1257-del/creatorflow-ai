import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-message";
import { SparklesIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentProfile, requireUser } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const [user, profile] = await Promise.all([requireUser(), getCurrentProfile()]);
  const name = profile?.full_name?.trim();
  const memberSince = profile
    ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(profile.created_at))
    : null;

  return (
    <>
      <PageHeader
        title={name ? `Welcome, ${name}` : "Welcome"}
        description="Your content workspace is ready."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <EmptyState
          className="lg:col-span-2"
          icon={<SparklesIcon />}
          title="No content yet"
          description="AI writing tools for blog posts, video scripts and social captions are coming next. Everything you create will appear here."
        />

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Your sign-in details.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium break-all">{user.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="mt-1 font-medium">{memberSince ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
