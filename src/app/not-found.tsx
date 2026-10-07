import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center py-24">
      <Container className="text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 text-muted-foreground">
          The page you are looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className={buttonClasses({ className: "mt-8" })}>
          Back to home
        </Link>
      </Container>
    </main>
  );
}
