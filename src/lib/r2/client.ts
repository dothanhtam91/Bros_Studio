/**
 * Cloudflare R2 (S3-compatible) client — server-only.
 * All credentials must be in environment variables; never expose to client.
 * @see SECURITY.md
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
 * Generate a presigned PUT URL for direct browser upload (bypasses 4.5 MB Vercel body limit).
 */
export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getR2Client();
  if (!bucket) throw new Error("R2_BUCKET_NAME is required");

  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 3600 }
  );
  return url;
}

/**
 * Build public URL for a key (for display only; uploadToR2 already returns this).
 */
export function getR2PublicUrl(key: string): string {
  if (!publicUrl) throw new Error("R2_PUBLIC_URL is required");
  return `${publicUrl.replace(/\/$/, "")}/${key.replace(/^\//, "")}`;
}

const PORTFOLIO_PREFIX = "portfolio/";
const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;

/** Stored DB path may be full R2 key or legacy flat filename — normalize to full key under portfolio/. */
export function normalizePortfolioR2Key(driveFileId: string): string {
  const k = driveFileId.trim();
  if (k.startsWith("portfolio/")) return k;
  return `${PORTFOLIO_PREFIX}${k.replace(/^\//, "")}`;
}

/**
 * List image keys in R2 under "portfolio/" excluding personal uploads (portfolio/user/...).
 */
export async function listR2StudioPortfolioKeys(): Promise<{ key: string; folder: string }[]> {
  const all = await listR2PortfolioKeys();
  return all.filter((item) => !item.key.startsWith(`${PORTFOLIO_PREFIX}user/`));
}

/**
 * List image keys in R2 under the portfolio prefix.
 * Used so uploads to R2 under "portfolio/" automatically appear on the portfolio page.
 */
export async function listR2PortfolioKeys(): Promise<{ key: string; folder: string }[]> {
  if (!getR2Config().configured || !bucket) return [];

  const items: { key: string; folder: string }[] = [];
  try {
    const client = getR2Client();
    let continuationToken: string | undefined;

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: PORTFOLIO_PREFIX,
          ContinuationToken: continuationToken,
        })
      );

      for (const obj of response.Contents ?? []) {
        const key = obj.Key;
        if (!key || !IMAGE_EXT.test(key)) continue;
        const parts = key.slice(PORTFOLIO_PREFIX.length).split("/");
        const folder = parts.length > 1 ? parts[0]! : "portfolio";
        items.push({ key, folder });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
  } catch (err) {
    console.error("[R2] listR2PortfolioKeys failed:", err);
    return [];
  }

  return items.sort((a, b) => a.key.localeCompare(b.key));
}
