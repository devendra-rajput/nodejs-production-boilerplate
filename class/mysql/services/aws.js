const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const heicConvert = require('heic-convert');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/** Custom Require * */
const response = require('../helpers/v1/response.helpers');

class AWSService {
  constructor() {
    // Created AWS S3 instance
    this.s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;
  }

  // Upload a single file to AWS S3 after storing locally
  uploadFile = async (req, res, next) => {
    console.log('AWSService@uploadFile');

    if (!req?.file?.path) {
      return response.badRequest('error.fileNotFound', res, false);
    }

    try {
      const { file } = req;

      const dateObj = new Date();
      const uploadDirectory = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      let fileName = `${file.fieldname}-${uuidv4()}-${moment().unix()}${path.extname(file.originalname)}`;
      let contentType = file.mimetype;
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      let fileBuffer = await fs.promises.readFile(file.path);

      // Convert HEIC to JPEG if necessary
      if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
        const jpegBuffer = await heicConvert({
          buffer: fileBuffer,
          format: 'JPEG',
          quality: 0.8,
        });

        fileBuffer = jpegBuffer; // Use converted buffer
        fileName = fileName.replace(/\.heic|\.heif$/, '.jpeg');
        contentType = 'image/jpeg';
      }

      // Defined S3 bucket params to upload the file
      const key = `${uploadDirectory}/${fileName}`;
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ACL: 'public-read',
        ContentType: contentType,
      };

      // Upload using v3 command
      const command = new PutObjectCommand(params);
      await this.s3.send(command);

      // Construct public URL manually
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // Attached uploaded image URL with request for further use
      req.image_url = fileUrl;

      // Delete file after uploading to S3
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(file.path)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlinkSync(file.path);
      }

      next();
    } catch (error) {
      console.log('Upload error:', error);
      return response.badRequest('error.fileNotUploaded', res, false);
    }
  };

  deleteFile = async (fileUrl) => {
    console.log('AWSService@deleteFile');

    // const bucket = process.env.AWS_S3_BUCKET_NAME;
    const url = new URL(fileUrl);
    const key = decodeURIComponent(url.pathname.substring(1)); // remove leading `/`

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3.send(command);

      return true;
    } catch (err) {
      return false;
    }
  };

  getPresignedUrl = async (folder, fileName, fileType, expiry = 5 * 60) => {
    console.log('AWSService@getPresignedUrl');
    try {
      const dateObj = new Date();
      const uploadDirectory = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

      // Sanitize filename and make unique
      const uniqueFileName = `${uuidv4()}-${moment().unix()}${path.extname(fileName)}`;
      const key = `${folder}/${uploadDirectory}/${uniqueFileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType,
        // ACL: "public-read", // Optional depending on bucket policy
      };

      const command = new PutObjectCommand(params);

      // 5 minutes expiry
      const signedUrl = await getSignedUrl(this.s3, command, { expiresIn: expiry });

      const publicUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        uploadUrl: signedUrl,
        publicUrl,
        key,
      };
    } catch (err) {
      console.log('AWSService@getPresignedUrl Error: ', err);
      return false;
    }
  };
}

// Export all functions
module.exports = new AWSService();
