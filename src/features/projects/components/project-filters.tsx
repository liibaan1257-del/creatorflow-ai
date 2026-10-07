import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { PROJECT_STATUS } from "@/features/projects/labels";

/**
 * Plain GET form: search and filter work without JavaScript and the URL is
 * shareable (/projects?q=…&status=…).
 */
export function ProjectFilters({ q, status }: { q: string; status: string }) {
  const active = Boolean(q || status);
  return (
    <form method="get" role="search" className="mb-4 flex flex-col gap-2 sm:flex-row">
      <label htmlFor="project-search" className="sr-only">
        Search projects
      </label>
      <input
        id="project-search"
        type="search"
        name="q"
        defaultValue={q}
        maxLength={100}
        placeholder="Search by title…"
        className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm shadow-card focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none"
      />
      <label htmlFor="project-status" className="sr-only">
        Status
      </label>
      <select
        id="project-status"
        name="status"
        defaultValue={status}
        className="h-10 rounded-lg border border-input bg-card px-3 text-sm shadow-card focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none"
      >
        <option value="">All statuses</option>
        {Object.entries(PROJECT_STATUS).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses({ variant: "outline", className: "flex-1 sm:flex-none" })}>
          Apply
        </button>
        {active ? (
          <Link href="/projects" className={buttonClasses({ variant: "ghost", className: "flex-1 sm:flex-none" })}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
