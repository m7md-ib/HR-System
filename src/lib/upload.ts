import "server-only";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "mays-hr-uploads";
const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function fileExtension(filename: string | undefined): string {
  if (!filename || !filename.includes(".")) return "";
  return filename.slice(filename.lastIndexOf("."));
}

/**
 * Saves an uploaded file and returns its public URL.
 *
 * On platforms with a persistent, writable filesystem (local dev, a
 * traditional server) this writes to /public/uploads. On serverless
 * platforms (Vercel) the filesystem is read-only at runtime, so when
 * SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are configured, this uploads to
 * a Supabase Storage bucket instead — the bucket must be public.
 */
export async function saveUploadedFile(file: File, subdir: string): Promise<string> {
  const filename = `${crypto.randomUUID()}${fileExtension(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const objectPath = `${subdir}/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
    return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
  }

  const dir = path.join(LOCAL_UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

export function isUploadableFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value && (value as File).size > 0;
}
