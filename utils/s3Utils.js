import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Create an S3 utility instance.
 * @param {Object} config
 * @param {string} config.region - AWS region
 * @param {string} config.accessKeyId - AWS access key
 * @param {string} config.secretAccessKey - AWS secret key
 * @param {string} config.bucket - S3 bucket name
 * @param {number} [config.bufferThreshold=52428800] - Threshold (in bytes) to switch to stream mode (default 50MB)
 * @returns {Object} - S3 utility methods
 */
export const createS3Util = ({
  region,
  accessKeyId,
  secretAccessKey,
  bucket,
  bufferThreshold = 50 * 1024 * 1024, // 50MB
}) => {
  if (!region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Missing required S3 configuration parameters");
  }

  const s3 = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  /**
   * Upload file (buffer or stream depending on size)
   * @param {Object|Array} input - Single file or array of files (from multer)
   * @param {string} [prefix="uploads"]
   * @returns {Promise<string|Array<string>>} - Uploaded S3 keys
   */
  const uploadToS3 = async (input, prefix = "uploads") => {
    if (Array.isArray(input)) {
      return Promise.all(input.map((f) => uploadSingle(f, prefix)));
    } else {
      return uploadSingle(input, prefix);
    }
  };

  const uploadSingle = async (file, prefix = "uploads") => {
    if (!file) throw new Error("File is required");

    const key = `${prefix}/${Date.now()}_${path.basename(file.originalname || "file")}`;
    const params = {
      Bucket: bucket,
      Key: key,
      ContentType: file.mimetype || "application/octet-stream",
    };

    // Choose upload mode
    if (file.size && file.size > bufferThreshold && file.path) {
      // Use stream mode for large files
      params.Body = fs.createReadStream(file.path);
    } else {
      params.Body = file.buffer || fs.createReadStream(file.path);
    }

    await s3.send(new PutObjectCommand(params));
    return key;
  };

  /**
   * Stream data directly from S3 (for video playback or file download)
   * @param {Object} res - Express response object
   * @param {string} key - S3 object key
   */
  const streamFromS3 = async (res, key) => {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const { Body, ContentType, ContentLength } = await s3.send(command);

      res.setHeader("Content-Type", ContentType || "application/octet-stream");
      res.setHeader("Content-Length", ContentLength);
      if (Body && Body.pipe) Body.pipe(res);
      else res.status(500).json({ error: "No stream available from S3" });
    } catch (err) {
      console.error("Error streaming from S3:", err);
      res.status(404).json({ error: "File not found" });
    }
  };

  /**
   * Generate signed URL for reading
   * @param {string} key
   * @param {number} [expiresIn=3600]
   */
  const getSignedReadUrl = async (key, expiresIn = 3600) => {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn });
  };

  /**
   * Generate signed URL for direct upload
   * (browser or mobile can PUT directly to S3)
   * @param {string} key
   * @param {string} contentType
   * @param {number} [expiresIn=3600]
   */
  const getSignedUploadUrl = async (key, contentType = "application/octet-stream", expiresIn = 3600) => {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(s3, command, { expiresIn });
  };

  /**
   * Delete one or multiple files from S3
   * @param {string|Array<string>} keys
   */
  const deleteFromS3 = async (keys) => {
    const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: Array.isArray(keys) ? keys.map((k) => ({ Key: k })) : [{ Key: keys }],
      },
    });
    await s3.send(deleteCommand);
  };

  return {
    uploadToS3,
    getSignedReadUrl,
    getSignedUploadUrl,
    streamFromS3,
    deleteFromS3,
  };
};
