import type { BrowserContext } from "@playwright/test";

export async function blockInvoiceWrites(context: BrowserContext): Promise<string[]> {
  const blockedRequests: string[] = [];

  await context.route(/\/api\/invoice(?:\/|\?|$)/i, async route => {
    const request = route.request();
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      blockedRequests.push(`${request.method()} ${request.url()}`);
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });

  return blockedRequests;
}
