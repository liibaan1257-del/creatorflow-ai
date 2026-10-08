import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/app-shell";
import { TemplateLibrary } from "@/features/templates/components/template-library";

export const metadata: Metadata = { title: "Templates" };

/** Static library: renders instantly (no user data needed). */
export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Proven starting points for blogs, YouTube, social media, SEO and e-commerce. Pick one to open it in the AI Writer."
      />
      <TemplateLibrary />
    </>
  );
}
