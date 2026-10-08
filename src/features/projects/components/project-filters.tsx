import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { PROJECT_STATUS, PROJECT_TYPE_LABELS } from "@/features/projects/labels";

const selectClass =
  "h-10 rounded-lg border border-input bg-card px-3 text-sm shadow-card focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none";

const SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

export type ProjectFilterValues = { q: string; type: string; status: string; sort: string };

/**
 * Plain GET form: search, filters and sorting work without JavaScript and the
 * URL is shareable (/projects?q=…&type=…&status=…&sort=…).
 */
export function ProjectFilters({ q, type, status, sort }: ProjectFilterValues) {
  const active = Boolean(q || type || status || (sort && sort !== "updated"));
  return (
    <form method="get" role="search" className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
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
        className={`${selectClass} min-w-0 sm:col-span-2 lg:flex-1`}
      />
      <label htmlFor="project-type" className="sr-only">
        Type
      </label>
      <select id="project-type" name="type" defaultValue={type} className={selectClass}>
        <option value="">All types</option>
        {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="project-status" className="sr-only">
        Status
      </label>
      <select id="project-status" name="status" defaultValue={status} className={selectClass}>
        <option value="">All statuses</option>
        {Object.entries(PROJECT_STATUS).map(([value, { label }]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="project-sort" className="sr-only">
        Sort
      </label>
      <select id="project-sort" name="sort" defaultValue={sort || "updated"} className={selectClass}>
        {SORTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button type="submit" className={buttonClasses({ variant: "outline", className: "flex-1 lg:flex-none" })}>
          Apply
        </button>
        {active ? (
          <Link href="/projects" className={buttonClasses({ variant: "ghost", className: "flex-1 lg:flex-none" })}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
