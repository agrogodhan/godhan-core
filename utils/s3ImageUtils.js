
// s3ImageUtils.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadImagesToS3(files, folder = 'uploads') {
  // files: single file object or array of file objects [{ buffer, fileName, mimeType }]
  const uploadOne = async (file) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${folder}/${file.fileName}`,
      Body: file.buffer,
      ContentType: file.mimeType,
      ACL: 'public-read'
    };
    const result = await s3.upload(params).promise();
    return result.Location;
  };
  if (Array.isArray(files)) {
    const results = [];
    for (const file of files) {
      results.push(await uploadOne(file));
    }
    return results;
  } else {
    return await uploadOne(files);
  }
}

async function deleteImageFromS3(fileUrl) {
  const bucket = process.env.AWS_S3_BUCKET;
  // Extract key from fileUrl
  const urlParts = fileUrl.split(`${bucket}/`);
  if (urlParts.length < 2) throw new Error('Invalid S3 URL');
  const Key = urlParts[1];
  const params = { Bucket: bucket, Key };
  await s3.deleteObject(params).promise();
  return true;
}

module.exports = { uploadImagesToS3, deleteImageFromS3 };
