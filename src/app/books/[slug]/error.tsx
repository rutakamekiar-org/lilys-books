"use client";

import StorefrontErrorState from "@/components/organisms/StorefrontErrorState";

export default function ProductErrorBoundary() {
  return (
    <>
      <title>Помилка | Lily&apos;s Books</title>
      <StorefrontErrorState kind="error" onRetry={() => window.location.reload()} />
    </>
  );
}
