import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRightIcon,
  CoinsIcon,
  FolderIcon,
  SparklesIcon,
} from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/state-message";
import { appNav } from "@/config/navigation";
import { ProjectList, ProjectListSkeleton } from "@/features/projects/components/project-list";
import { getProjectCount, listProjects } from "@/features/projects/queries";
import {
  getCurrentCredits,
  getCurrentProfile,
  getCurrentSubscription,
} from "@/lib/auth/dal";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const RECENT_PROJECTS = 5;
const PLAN_LABELS = { free: "Free", pro: "Pro", business: "Business" } as const;

/** Quick actions reuse the sidebar config so labels, links and icons stay in sync. */
const QUICK_ACTIONS = [
  { href: "/writer", description: "Write blog posts, scripts and captions." },
  { href: "/images", description: "Create thumbnails and social graphics." },
  { href: "/projects", description: "Browse and manage everything you've made." },
  { href: "/templates", description: "Start from a proven structure." },
].map((action) => ({ ...action, nav: appNav.find((item) => item.href === action.href)! }));

/**
 * Each data section streams independently behind its own <Suspense>, so the
 * page frame and quick actions render instantly.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<WelcomeSkeleton />}>
        <Welcome />
      </Suspense>

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Overview
        </h2>
        <Suspense fallback={<StatsSkeleton />}>
          <Stats />
        </Suspense>
      </section>

      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold tracking-tight">
          Quick actions
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, description, nav }) => (
            <li key={href}>
              <Link href={href} className="group block h-full rounded-xl">
                <Card className="h-full p-5 transition-colors group-hover:border-primary/40 group-hover:bg-primary-soft/40">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                      <nav.icon className="size-5" />
                    </span>
                    {nav.comingSoon ? <Badge>Soon</Badge> : null}
                  </div>
                  <h3 className="mt-4 flex items-center gap-1.5 font-semibold">
                    {nav.label}
                    <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-heading">
        <Card>
          <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
            <div className="space-y-1">
              <h2 id="recent-heading" className="text-base font-semibold tracking-tight">
                Recent projects
              </h2>
              <p className="text-sm text-muted-foreground">Your latest work, most recent first.</p>
            </div>
            <Link href="/projects" className={buttonClasses({ variant: "ghost", size: "sm" })}>
              View all
            </Link>
          </div>
          <div className="border-t border-border">
            <Suspense fallback={<ProjectListSkeleton />}>
              <RecentProjects />
            </Suspense>
          </div>
        </Card>
      </section>
    </div>
  );
}

async function Welcome() {
  const profile = await getCurrentProfile();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      </h1>
      <p className="text-muted-foreground">Here&apos;s what&apos;s happening in your workspace.</p>
    </div>
  );
}

async function Stats() {
  const [credits, subscription, projectCount] = await Promise.all([
    getCurrentCredits(),
    getCurrentSubscription(),
    getProjectCount(),
  ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Credit balance"
        icon={<CoinsIcon />}
        value={credits ? formatNumber(credits.balance) : "—"}
        progress={credits && credits.monthly_limit > 0 ? credits.balance / credits.monthly_limit : undefined}
        hint={credits ? `of ${formatNumber(credits.monthly_limit)} this month` : "Credits are not set up yet"}
      />
      <StatCard
        label="Monthly limit"
        icon={<SparklesIcon />}
        value={credits ? formatNumber(credits.monthly_limit) : "—"}
        hint={credits ? `Resets on ${formatDate(credits.reset_date)}` : undefined}
      />
      <StatCard
        label="Total projects"
        icon={<FolderIcon />}
        value={formatNumber(projectCount)}
        hint={projectCount === 0 ? "Create your first project soon" : "Across all content types"}
      />
      <StatCard
        label="Current plan"
        icon={<SparklesIcon />}
        value={subscription ? PLAN_LABELS[subscription.plan] : "—"}
        hint={subscription?.expires_at ? `Renews ${formatDate(subscription.expires_at)}` : "Early access"}
      />
    </div>
  );
}

async function RecentProjects() {
  const projects = await listProjects(RECENT_PROJECTS);
  if (projects.length === 0) {
    return (
      <EmptyState
        className="m-5 sm:m-6"
        icon={<FolderIcon />}
        title="No projects yet"
        description="When the AI Writer launches, everything you create will show up here."
      />
    );
  }
  return <ProjectList projects={projects} />;
}

function WelcomeSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-72" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading overview">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}
