import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state-message";
import { CREDIT_COSTS } from "@/config/credits";
import { getCreditHistory, getCurrentCredits, getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CreditReason } from "@/types/database";

export const metadata: Metadata = { title: "Settings" };

const REASON_LABELS: Record<CreditReason, string> = {
  signup_grant: "Welcome credits",
  monthly_reset: "Monthly reset",
  generation: "AI Writer",
  regeneration: "AI Writer regeneration",
  image: "AI Image",
  image_regeneration: "AI Image regeneration",
  plan_change: "Plan change",
  adjustment: "Allowance update",
};

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
  const [user, profile, credits, history] = await Promise.all([
    requireUser(),
    getCurrentProfile(),
    getCurrentCredits(),
    getCreditHistory(20),
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
            <Row label="Plan">{credits ? <Badge variant="primary">{credits.plan_name}</Badge> : "—"}</Row>
            <Row label="Credit balance">{credits ? formatNumber(credits.balance) : "—"}</Row>
            <Row label="Monthly allowance">{credits ? formatNumber(credits.monthly_limit) : "—"}</Row>
            <Row label="Next reset">{credits ? formatDate(credits.reset_date, "long") : "—"}</Row>
            <Row label="Costs">
              AI Writer {CREDIT_COSTS.writer} · AI Image {CREDIT_COSTS.image} · Regeneration {CREDIT_COSTS.regeneration}
            </Row>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Your balance is reset to your monthly allowance on the reset date. Unused credits don&apos;t roll over, and
            failed generations are never charged.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Credit history</CardTitle>
          <CardDescription>Your most recent credit activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title="No credit activity yet" description="Credits you use or receive will appear here." />
          ) : (
            <ul className="divide-y divide-border" aria-label="Credit history">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{REASON_LABELS[entry.reason] ?? entry.reason}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.created_at, "long")}</p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        entry.amount > 0 ? "text-success" : "text-foreground",
                      )}
                    >
                      {entry.amount > 0 ? "+" : "−"}
                      {formatNumber(Math.abs(entry.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">Balance {formatNumber(entry.balance_after)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
      <Skeleton className="h-48 rounded-xl lg:col-span-2" />
    </div>
  );
}
