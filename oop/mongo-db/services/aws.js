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
const { BaseService } = require('../core');
const response = require('../helpers/v1/response.helpers');

/**
 * AWSService - AWS S3 File Operations
 * Handles file uploads, deletions, and presigned URLs
 */
class AWSService extends BaseService {
  constructor() {
    super('AWSService');
    this.s3 = null;
    this.bucketName = process.env.AWS_S3_BUCKET_NAME;

    // Automatically bind all public methods to preserve 'this' context
    // This is necessary because Express passes methods as callbacks
    this._autoBindMethods();
  }

  /**
  * Initialize S3 client
  */
  async initialize() {
    return this._executeWithErrorHandling('initialize', async () => {
      this.s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });

      this._setInitialized(true);
      console.log(`${this.serviceName}: S3 client initialized`);
      return true;
    });
  }

  /**
  * Get or create S3 client
  */
  async _getS3Client() {
    if (!this.s3) {
      await this.initialize();
    }
    return this.s3;
  }

  /**
  * Generate upload directory path
  */
  _getUploadDirectory() {
    const dateObj = new Date();
    return `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  }

  /**
  * Convert HEIC to JPEG if needed
  */
  async _convertHeicIfNeeded(file, fileBuffer) {
    if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') {
      const jpegBuffer = await heicConvert({
        buffer: fileBuffer,
        format: 'JPEG',
        quality: 0.8,
      });

      return {
        buffer: jpegBuffer,
        fileName: file.originalname.replace(/\.heic|\.heif$/, '.jpeg'),
        contentType: 'image/jpeg',
      };
    }

    return {
      buffer: fileBuffer,
      fileName: file.originalname,
      contentType: file.mimetype,
    };
  }

  /**
  * Upload a single file to AWS S3
  */
  async uploadFile(req, res, next) {
    return this._executeWithErrorHandling('uploadFile', async () => {
      if (!req?.file?.path) {
        return response.badRequest('error.fileNotFound', res, false);
      }

      const { file } = req;
      const s3 = await this._getS3Client();

      // Read file buffer
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      let fileBuffer = await fs.promises.readFile(file.path);

      // Convert HEIC if needed
      const converted = await this._convertHeicIfNeeded(file, fileBuffer);
      fileBuffer = converted.buffer;

      // Generate file name and key
      const uploadDirectory = this._getUploadDirectory();
      const fileName = `${file.fieldname}-${uuidv4()}-${moment().unix()}${path.extname(converted.fileName)}`;
      const key = `${uploadDirectory}/${fileName}`;

      // Upload to S3
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        // ACL: 'public-read',
        ContentType: converted.contentType,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      // Construct public URL
      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      req.image_url = fileUrl;

      // Delete local file
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(file.path)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlinkSync(file.path);
      }

      next();
    }).catch((error) => response.exception('error.fileNotUploaded', res, {
      error: typeof error === 'string' ? error : error.message,
    }));
  }

  /**
  * Delete file from S3
  */
  async deleteFile(fileUrl) {
    return this._executeWithErrorHandling('deleteFile', async () => {
      this._validateParams({ fileUrl }, ['fileUrl']);

      const s3 = await this._getS3Client();
      const url = new URL(fileUrl);
      const key = decodeURIComponent(url.pathname.substring(1));

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await s3.send(command);
      return true;
    });
  }

  /**
  * Get presigned URL for direct upload
  */
  async getPresignedUrl(folder, fileName, fileType, expiry = 5 * 60) {
    return this._executeWithErrorHandling('getPresignedUrl', async () => {
      this._validateParams({ folder, fileName, fileType }, ['folder', 'fileName', 'fileType']);

      const s3 = await this._getS3Client();
      const uploadDirectory = this._getUploadDirectory();
      const uniqueFileName = `${uuidv4()}-${moment().unix()}${path.extname(fileName)}`;
      const key = `${folder}/${uploadDirectory}/${uniqueFileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType,
      };

      const command = new PutObjectCommand(params);
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: expiry });
      const publicUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        uploadUrl: signedUrl,
        publicUrl,
        key,
      };
    });
  }

  /**
  * Cleanup S3 client
  */
  async cleanup() {
    return this._executeWithErrorHandling('cleanup', async () => {
      if (this.s3) {
        this.s3.destroy();
        this.s3 = null;
      }
      this._setInitialized(false);
      console.log(`${this.serviceName}: Cleanup completed`);
      return true;
    });
  }
}

module.exports = new AWSService();
