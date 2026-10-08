import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/state-message";
import { CREDIT_COSTS } from "@/config/credits";
import { authNoticeMessage } from "@/features/auth/messages";
import { DeleteAccount, PasswordForm, PreferencesForm, SessionActions } from "@/features/settings/components/account-forms";
import { AvatarField, EmailForm, ProfileForm } from "@/features/settings/components/profile-section";
import { getAuthAccount, getCreditHistory, getCurrentCredits, getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { formatDate, formatNumber, initials } from "@/lib/format";
import { resolveAvatarUrl } from "@/lib/storage/server";
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

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <>
      <PageHeader title="Settings" description="Your profile, preferences, plan and account." />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Row({ label, stacked, children }: { label: string; stacked?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1 py-3", !stacked && "sm:flex-row sm:items-center sm:justify-between")}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-medium break-words", !stacked && "sm:text-right")}>{children}</dd>
    </div>
  );
}

async function SettingsContent({ searchParams }: Pick<PageProps<"/settings">, "searchParams">) {
  const [user, profile, credits, history, account, params] = await Promise.all([
    requireUser(),
    getCurrentProfile(),
    getCurrentCredits(),
    getCreditHistory(20),
    getAuthAccount(),
    searchParams,
  ]);
  const name = profile?.full_name?.trim() || null;
  const email = account?.email ?? profile?.email ?? user.email;
  const avatarSrc = await resolveAvatarUrl(profile?.avatar_url);
  const notice = authNoticeMessage(params.notice);

  return (
    <div className="space-y-6">
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How you appear in CreatorFlow AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarField src={avatarSrc} initials={initials(name, email)} hasAvatar={Boolean(profile?.avatar_url)} />
              <div className="border-t border-border pt-6">
                <ProfileForm fullName={name} />
              </div>
              <div className="border-t border-border pt-6">
                <EmailForm email={email} pendingEmail={account?.pendingEmail ?? null} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Defaults for new content.</CardDescription>
            </CardHeader>
            <CardContent>
              <PreferencesForm tone={profile?.default_tone ?? null} language={profile?.default_language ?? null} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Password, sessions and account deletion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section aria-labelledby="password-heading" className="space-y-4">
                <h3 id="password-heading" className="text-sm font-semibold">Change password</h3>
                <PasswordForm />
              </section>
              <section aria-labelledby="sessions-heading" className="space-y-3 border-t border-border pt-6">
                <h3 id="sessions-heading" className="text-sm font-semibold">Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Log out here, or everywhere if you used a shared or lost device.
                </p>
                <SessionActions />
              </section>
              <section
                aria-labelledby="danger-heading"
                className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              >
                <h3 id="danger-heading" className="text-sm font-semibold text-destructive">Delete account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently deletes your account and everything in it: projects, generations, images, files and
                  credits.
                </p>
                <DeleteAccount />
              </section>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-20">
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
                <Row label="Costs" stacked>
                  AI Writer {CREDIT_COSTS.writer} · AI Image {CREDIT_COSTS.image} · Regeneration {CREDIT_COSTS.regeneration}
                </Row>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Your balance is reset to your monthly allowance on the reset date. Unused credits don&apos;t roll over, and
                failed generations are never charged.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
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
    <div
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="space-y-6">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
