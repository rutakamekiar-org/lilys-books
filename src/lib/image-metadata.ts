import metadata from "@/generated/image-metadata.json";

export type ImageMetadata = { width: number; height: number };

const localMetadata = metadata as Record<string, ImageMetadata>;

function localPath(src: string): string | null {
    if (src.startsWith("/")) return src.split(/[?#]/, 1)[0];

    try {
        const url = new URL(src);
        if (url.hostname === "zvychajna.pp.ua" || url.hostname === "www.zvychajna.pp.ua") {
            return url.pathname;
        }
    } catch {
        return null;
    }

    return null;
}

export function getImageMetadata(src: string): ImageMetadata | undefined {
    const path = localPath(src);
    return path ? localMetadata[path] : undefined;
}
