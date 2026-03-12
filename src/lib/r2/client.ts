/**
 * Cloudflare R2 (S3-compatible) client — server-only.
 * All credentials must be in environment variables; never expose to client.
 * @see SECURITY.md
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev or custom domain

export function getR2Config() {
  return {
    accountId,
    bucket,
    publicUrl: publicUrl?.replace(/\/$/, "") ?? null,
    configured: Boolean(accountId && accessKeyId && secretAccessKey && bucket && publicUrl),
  };
}

function createClient(): S3Client {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

let _client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!_client) _client = createClient();
  return _client;
}

/**
 * Upload a buffer to R2 and return the public URL.
 * Key format: albums/{albumId}/{uuid}.ext or realtors/{realtorId}/headshot.ext
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  if (!bucket) throw new Error("R2_BUCKET_NAME is required");
  if (!publicUrl) throw new Error("R2_PUBLIC_URL is required for public read URL");

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${publicUrl}/${key}`;
}

/**
 * Delete an object from R2 by key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  if (!bucket) throw new Error("R2_BUCKET_NAME is required");

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

/**
 * Build public URL for a key (for display only; uploadToR2 already returns this).
 */
export function getR2PublicUrl(key: string): string {
  if (!publicUrl) throw new Error("R2_PUBLIC_URL is required");
  return `${publicUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}
