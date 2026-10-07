import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCurrentCredits,
  getCurrentProfile,
  getCurrentSubscription,
  requireUser,
} from "@/lib/auth/dal";
import { formatDate, formatNumber, initials } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business" } as const;

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your account, plan and usage." />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-all sm:text-right">{children}</dd>
    </div>
  );
}

async function SettingsContent() {
  const [user, profile, credits, subscription] = await Promise.all([
    requireUser(),
    getCurrentProfile(),
    getCurrentCredits(),
    getCurrentSubscription(),
  ]);
  const name = profile?.full_name?.trim() || null;
  const email = profile?.email ?? user.email;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Editing your profile is coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center gap-4">
            <Avatar fallback={initials(name, email)} src={profile?.avatar_url} size="lg" />
            <div className="min-w-0">
              <p className="truncate font-medium">{name ?? "No name set"}</p>
              <p className="truncate text-sm text-muted-foreground">{email ?? "—"}</p>
            </div>
          </div>
          <dl className="divide-y divide-border">
            <Row label="Member since">{profile ? formatDate(profile.created_at, "long") : "—"}</Row>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan & credits</CardTitle>
          <CardDescription>Paid plans are coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            <Row label="Plan">
              {subscription ? (
                <Badge variant="primary">{PLAN_LABELS[subscription.plan]}</Badge>
              ) : (
                "—"
              )}
            </Row>
            <Row label="Credit balance">{credits ? formatNumber(credits.balance) : "—"}</Row>
            <Row label="Monthly limit">{credits ? formatNumber(credits.monthly_limit) : "—"}</Row>
            <Row label="Next reset">{credits ? formatDate(credits.reset_date, "long") : "—"}</Row>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-busy="true" aria-label="Loading settings">
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
