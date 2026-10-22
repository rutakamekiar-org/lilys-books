// The product API mixes absolute storefront URLs and root-relative paths for the same file.
// Normalize them so each image has one optimizer URL and the browser downloads it once.
export function storefrontImageSource(source: string): string {
  try {
    const url = new URL(source);
    if (url.hostname === "zvychajna.pp.ua" || url.hostname === "www.zvychajna.pp.ua") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Root-relative assets already refer to the storefront's images.
  }
  return source;
}

export function getProductGalleryImages(cover: string, images: string[] = []): string[] {
  return [...new Set([cover, ...images].filter(Boolean).map(storefrontImageSource))];
}
