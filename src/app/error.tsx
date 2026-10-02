"use client";

import StorefrontErrorState from "@/components/organisms/StorefrontErrorState";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  return (
    <>
      <title>Помилка | Lily&apos;s Books</title>
      <StorefrontErrorState kind="error" onRetry={reset} />
    </>
  );
}
