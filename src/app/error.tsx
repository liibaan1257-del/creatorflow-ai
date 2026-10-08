"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { RefreshIcon } from "@/components/ui/icons";
import { ErrorState } from "@/components/ui/state-message";

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
    <main id="main-content" tabIndex={-1} className="flex flex-1 items-center py-16 outline-none">
      <Container className="max-w-xl">
        <ErrorState
          headingLevel="h1"
          description="An unexpected error occurred. Please try again."
          action={
            <Button onClick={reset}>
              <RefreshIcon />
              Try again
            </Button>
          }
        />
      </Container>
    </main>
  );
}
