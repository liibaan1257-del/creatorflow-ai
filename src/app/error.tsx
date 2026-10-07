"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook point for an error-reporting service later on.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center py-24">
      <Container className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-4 text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} className="mt-8">
          Try again
        </Button>
      </Container>
    </main>
  );
}
