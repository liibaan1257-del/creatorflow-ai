import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { TemplateIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <ComingSoon
      title="Templates"
      description="Proven structures to start from."
      icon={<TemplateIcon />}
      details="Templates for listicles, how-to guides, product descriptions and more are in development."
    />
  );
}
