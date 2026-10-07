"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshIcon } from "@/components/ui/icons";
import { ErrorState } from "@/components/ui/state-message";

/** Errors inside the app keep the sidebar and top bar visible. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="We couldn't load this page"
      description="Something went wrong while loading your data. Please try again."
      action={
        <Button onClick={reset}>
          <RefreshIcon />
          Try again
        </Button>
      }
    />
  );
}
