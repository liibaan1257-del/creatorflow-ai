import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/app-shell";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state-message";
import { AUTH_ROUTES } from "@/lib/auth/redirect";

type ComingSoonProps = {
  title: string;
  description: string;
  icon: ReactNode;
  details: string;
};

/** Honest placeholder for a section that is in development. */
export function ComingSoon({ title, description, icon, details }: ComingSoonProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Coming soon"
        description={details}
        action={
          <Link href={AUTH_ROUTES.afterLogin} className={buttonClasses({ variant: "outline" })}>
            Back to dashboard
          </Link>
        }
      />
    </>
  );
}
