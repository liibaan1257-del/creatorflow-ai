import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FileTextIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/state-message";

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="flex flex-1 items-center py-16 outline-none">
      <Container className="max-w-xl">
        <EmptyState
          icon={<FileTextIcon />}
          headingLevel="h1"
          title="Page not found"
          description="The page you are looking for doesn't exist or has moved."
          action={
            <Link href="/" className={buttonClasses()}>
              Back to home
            </Link>
          }
        />
      </Container>
    </main>
  );
}
