import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/** Saves an uploaded File to /public/uploads/<subdir>/ and returns its public URL path. */
export async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name || "").slice(0, 10);
  const filename = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}

export function isUploadableFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && (value as File).size > 0;
}
