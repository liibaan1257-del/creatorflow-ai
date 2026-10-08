"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/state-message";
import { TEMPLATE_CATEGORIES, TEMPLATES, type TemplateCategory } from "@/features/templates/data";
import { getWriterType } from "@/features/writer/config";
import { cn } from "@/lib/utils";

/** Searchable, filterable grid of templates. Data is static, so filtering is client-side. */
export function TemplateLibrary() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "All">("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATES.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (!q || `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(q)),
    );
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:w-80">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="template-search" className="sr-only">
            Search templates
          </label>
          <input
            id="template-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm shadow-card focus:border-ring focus:ring-3 focus:ring-ring/20 focus:outline-none"
          />
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {(["All", ...TEMPLATE_CATEGORIES] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={cn(
                "h-8 cursor-pointer rounded-full border px-3 text-sm font-medium transition-colors",
                category === value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {results.length} template{results.length === 1 ? "" : "s"} shown
      </p>

      {results.length === 0 ? (
        <EmptyState title="No templates found" description="Try a different search or category." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((template) => {
            const writerType = getWriterType(template.writerType);
            return (
              <li key={template.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                      <template.icon className="size-5" />
                    </span>
                    <Badge>{template.category}</Badge>
                  </div>
                  <h2 className="mt-4 font-semibold tracking-tight">{template.name}</h2>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{template.description}</p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {writerType ? `${writerType.credits} credit${writerType.credits === 1 ? "" : "s"}` : null}
                    </span>
                    <Link
                      href={`/writer?template=${template.id}`}
                      className={buttonClasses({ size: "sm" })}
                      aria-label={`Use template: ${template.name}`}
                    >
                      Use Template
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
