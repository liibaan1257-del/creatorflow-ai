import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { FolderIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/state-message";

/** Shown inside the app shell for missing, malformed or other users' project ids. */
export default function ProjectNotFound() {
  return (
    <EmptyState
      icon={<FolderIcon />}
      headingLevel="h1"
      title="Project not found"
      description="It may have been deleted, or the link is incorrect."
      action={
        <Link href="/projects" className={buttonClasses()}>
          Back to My Projects
        </Link>
      }
    />
  );
}
