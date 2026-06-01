import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID  = process.env.R2_ACCOUNT_ID!;
const BUCKET      = process.env.R2_BUCKET_NAME ?? "pikmi-uploads";
const PUBLIC_URL  = process.env.R2_PUBLIC_URL!;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Uploaduj fajl na R2 i vrati public URL
 */
export async function uploadToR2(
  path: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    Body: body,
    ContentType: contentType,
  }));
  return `${PUBLIC_URL}/${path}`;
}

/**
 * Obrisi fajl sa R2
 */
export async function deleteFromR2(path: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: path }));
}
