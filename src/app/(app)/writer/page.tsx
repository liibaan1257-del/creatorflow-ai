import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PenIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "AI Writer" };

export default function WriterPage() {
  return (
    <ComingSoon
      title="AI Writer"
      description="Blog posts, video scripts and social captions."
      icon={<PenIcon />}
      details="The AI Writer is in development. Your drafts will be saved to My Projects automatically."
    />
  );
}
