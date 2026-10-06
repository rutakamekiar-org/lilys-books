function gallerySource(source: string): string {
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
  return [...new Set([cover, ...images].filter(Boolean).map(gallerySource))];
}
