import Link from "next/link";
import { ProfileMenu } from "@/components/layout/profile-menu";
import { CoinsIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentCredits, getCurrentProfile, requireUser } from "@/lib/auth/dal";
import { formatNumber, initials } from "@/lib/format";
import { resolveAvatarUrl } from "@/lib/storage/server";

/**
 * Credits pill + profile menu for the top bar. Reads the session: render
 * inside <Suspense>, wrapped in an ErrorBoundary (see AppShell) so a data
 * error here never takes the app shell down.
 */
export async function UserNav() {
  const [user, profile, credits] = await Promise.all([
    requireUser(),
    getCurrentProfile(),
    getCurrentCredits(),
  ]);
  const name = profile?.full_name?.trim() || null;
  const email = profile?.email ?? user.email;
  const avatarUrl = await resolveAvatarUrl(profile?.avatar_url);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {credits ? (
        <Link
          href="/settings"
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-card transition-colors hover:bg-muted"
          aria-label={`${credits.balance} credits remaining`}
        >
          <CoinsIcon className="size-4 text-primary" />
          <span className="tabular-nums">{formatNumber(credits.balance)}</span>
          <span className="hidden text-muted-foreground sm:inline">credits</span>
        </Link>
      ) : null}
      <ProfileMenu
        user={{ name, email, avatarUrl, initials: initials(name, email) }}
      />
    </div>
  );
}

export function UserNavSkeleton() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="size-8 rounded-full" />
    </div>
  );
}

/** Shown if the user's data can't be loaded: the menu (and Log out) still work. */
export function UserNavFallback() {
  return <ProfileMenu user={{ name: null, email: null, avatarUrl: null, initials: "?" }} />;
}
