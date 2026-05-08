import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import coreLogger from './logger.js';

/**
 * AWS S3 utilities (SDK v3) — no credentials stored here.
 * Caller creates and passes an S3Client instance.
 *
 * Usage:
 *   import { S3Client } from '@aws-sdk/client-s3';
 *   const s3Client = new S3Client({
 *     region: process.env.AWS_REGION,
 *     credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
 *   });
 *
 *   await core.utils.s3.uploadToS3({ s3Client, bucket, key, buffer, contentType, logger: appLogger });
 *   const url = await core.utils.s3.getPresignedUrlView({ s3Client, bucket, key, expiresIn: 3600 });
 */

async function uploadToS3({ s3Client, bucket, key, buffer, contentType, acl, logger = coreLogger }) {
  if (!s3Client) {
    logger.warn('[core.s3] no client — mock upload', { bucket, key, size: buffer?.length ?? 0 });
    return { ok: true, mock: true, key };
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ...(acl && { ACL: acl }),
  });

  return s3Client.send(command);
}

async function getPresignedUrlUpload({ s3Client, bucket, key, contentType, expiresIn = 300 }) {
  if (!s3Client) {
    return `https://mock-s3/${bucket}/${key}`;
  }

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3Client, command, { expiresIn });
}

async function getPresignedUrlView({ s3Client, bucket, key, expiresIn = 300 }) {
  if (!s3Client) {
    return `https://mock-s3/${bucket}/${key}`;
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
}

async function deleteFromS3({ s3Client, bucket, key, logger = coreLogger }) {
  if (!s3Client) {
    logger.warn('[core.s3] no client — mock delete', { bucket, key });
    return { ok: true, mock: true };
  }

  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  return s3Client.send(command);
}

const s3Utils = { uploadToS3, getPresignedUrlUpload, getPresignedUrlView, deleteFromS3 };
export default s3Utils;
