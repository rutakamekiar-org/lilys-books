"use client";

import StorefrontErrorState from "@/components/organisms/StorefrontErrorState";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="uk">
      <head>
        <title>Помилка | Lily&apos;s Books</title>
      </head>
      <body style={{ margin: 0 }}>
        <main>
          <StorefrontErrorState kind="error" onRetry={reset} />
        </main>
      </body>
    </html>
  );
}
