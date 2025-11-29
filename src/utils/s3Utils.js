import aws from 'aws-sdk';

async function uploadToS3({ s3Client, bucket, key, buffer, contentType, acl = 'private' }) {
  if (!s3Client) {
    console.log('[core.s3] mock upload', { bucket, key, size: buffer ? buffer.length : 0 });
    return { ok: true, mock: true, key };
  }
  const params = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: acl
  };
  return s3Client.upload(params).promise();
}

function getPresignedUrlUpload({ s3Client, bucket, key, contentType, expiresIn = 300 }) {
  if (!s3Client) {
    return { ok: true, mock: true, url: `https://mock-s3/${bucket}/${key}` };
  }
  const params = { Bucket: bucket, Key: key, Expires: expiresIn, ContentType: contentType };
  if (typeof s3Client.getSignedUrlPromise === 'function') {
    return s3Client.getSignedUrlPromise('putObject', params);
  }
  return new Promise((resolve, reject) => {
    s3Client.getSignedUrl('putObject', params, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}

function getPresignedUrlView({ s3Client, bucket, key, expiresIn = 300 }) {
  if (!s3Client) return { ok: true, mock: true, url: `https://mock-s3/${bucket}/${key}` };
  const params = { Bucket: bucket, Key: key, Expires: expiresIn };
  if (typeof s3Client.getSignedUrlPromise === 'function') {
    return s3Client.getSignedUrlPromise('getObject', params);
  }
  return new Promise((resolve, reject) => {
    s3Client.getSignedUrl('getObject', params, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}

async function deleteFromS3({ s3Client, bucket, key }) {
  if (!s3Client) {
    console.log('[core.s3] mock delete', { bucket, key });
    return { ok: true, mock: true };
  }
  const params = { Bucket: bucket, Key: key };
  return s3Client.deleteObject(params).promise();
}

const s3Utils = { uploadToS3, getPresignedUrlUpload, getPresignedUrlView, deleteFromS3 };
export default s3Utils;
