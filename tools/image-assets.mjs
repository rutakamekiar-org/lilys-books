import { copyFile, mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const imagesRoot = path.join(projectRoot, "public", "images");
const metadataPath = path.join(projectRoot, "src", "generated", "image-metadata.json");
const supportedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const shouldOptimize = process.argv.includes("--optimize");
const minimumBytes = 500_000;

async function listImages(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async entry => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) return listImages(fullPath);
        return supportedExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
    }));
    return files.flat().sort((a, b) => a.localeCompare(b));
}

function publicUrl(filePath) {
    return `/${path.relative(path.join(projectRoot, "public"), filePath).split(path.sep).join("/")}`;
}

async function optimizeImage(filePath) {
    const before = await stat(filePath);
    if (before.size < minimumBytes) return null;

    const extension = path.extname(filePath).toLowerCase();
    const temporaryPath = `${filePath}.zvy8.tmp`;
    const input = await readFile(filePath);
    let pipeline = sharp(input, { failOn: "warning" })
        .rotate()
        .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });

    if (extension === ".jpg" || extension === ".jpeg") {
        pipeline = pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true });
    } else if (extension === ".png") {
        pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, palette: true, quality: 90 });
    } else if (extension === ".webp") {
        pipeline = pipeline.webp({ quality: 82, effort: 5, smartSubsample: true });
    } else if (extension === ".avif") {
        pipeline = pipeline.avif({ quality: 55, effort: 5 });
    } else {
        return null;
    }

    await unlink(temporaryPath).catch(error => {
        if (error.code !== "ENOENT") throw error;
    });
    await pipeline.toFile(temporaryPath);
    const after = await stat(temporaryPath);
    if (after.size >= before.size * 0.95) {
        await unlink(temporaryPath);
        return null;
    }

    await copyFile(temporaryPath, filePath);
    await unlink(temporaryPath);
    return { url: publicUrl(filePath), before: before.size, after: after.size };
}

const files = await listImages(imagesRoot);
const optimized = [];

if (shouldOptimize) {
    for (const file of files) {
        const result = await optimizeImage(file);
        if (result) optimized.push(result);
    }
}

const metadata = {};
for (const file of files) {
    const image = await sharp(file).metadata();
    if (image.width && image.height) {
        metadata[publicUrl(file)] = { width: image.width, height: image.height };
    }
}

await mkdir(path.dirname(metadataPath), { recursive: true });
await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

if (shouldOptimize) {
    const before = optimized.reduce((total, image) => total + image.before, 0);
    const after = optimized.reduce((total, image) => total + image.after, 0);
    console.log(`Optimized ${optimized.length} images: ${before} -> ${after} bytes`);
    for (const image of optimized) {
        console.log(`${image.url}: ${image.before} -> ${image.after}`);
    }
}
console.log(`Wrote metadata for ${Object.keys(metadata).length} images to ${path.relative(projectRoot, metadataPath)}`);
