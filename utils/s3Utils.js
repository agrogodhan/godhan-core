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
      params.Body = file.buffer || (file.path && fs.createReadStream(file.path));
    }

    await s3.send(new PutObjectCommand(params));
    return key;
  };

  /**
   * Stream file from S3 to an Express response, supporting Range requests.
   * @param {Object} res - Express response
   * @param {string} key - S3 object key
   * @param {Object} [options]
   * @param {Object} [req] - Express request (optional, used to read Range header)
   */
  const streamFromS3 = async (res, key, options = {}, req = null) => {
    try {
      // Obtain metadata (content-length, content-type)
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      const fileSize = head.ContentLength;
      const contentType = head.ContentType || "application/octet-stream";

      // If request provided and has Range header, handle partial content
      const rangeHeader = req && req.headers && req.headers.range;
      if (rangeHeader) {
        // Parse "bytes=start-end"
        const matches = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
        if (!matches) {
          res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
          return res.end();
        }

        let start = matches[1] === "" ? undefined : parseInt(matches[1], 10);
        let end = matches[2] === "" ? undefined : parseInt(matches[2], 10);

        if (start === undefined && end !== undefined) {
          // suffix-length: last `end` bytes
          start = Math.max(fileSize - end, 0);
          end = fileSize - 1;
        } else if (start !== undefined && end === undefined) {
          end = fileSize - 1;
        }

        // Validate range
        if (start >= fileSize || end >= fileSize || start > end) {
          res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
          return res.end();
        }

        const contentLength = end - start + 1;
        const s3Range = `bytes=${start}-${end}`;

        const command = new GetObjectCommand({ Bucket: bucket, Key: key, Range: s3Range });
        const data = await s3.send(command);

        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Content-Length", contentLength);
        res.setHeader("Content-Type", contentType);

        // Body from aws sdk V3 is a stream (Readable) — pipe it
        if (data.Body && data.Body.pipe) {
          data.Body.pipe(res);
        } else {
          // fallback: collect buffer and send
          const chunks = [];
          for await (const chunk of data.Body) chunks.push(chunk);
          res.end(Buffer.concat(chunks));
        }
      } else {
        // No Range header — return full file
        const command = new GetObjectCommand({ Bucket: bucket, Key: key });
        const data = await s3.send(command);

        res.status(200);
        res.setHeader("Content-Length", fileSize);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Accept-Ranges", "bytes");

        if (data.Body && data.Body.pipe) {
          data.Body.pipe(res);
        } else {
          const chunks = [];
          for await (const chunk of data.Body) chunks.push(chunk);
          res.end(Buffer.concat(chunks));
        }
      }
    } catch (err) {
      // Map common errors
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        res.status(404).json({ error: "File not found" });
      } else {
        console.error("streamFromS3 error:", err);
        res.status(500).json({ error: "Failed to stream file" });
      }
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
