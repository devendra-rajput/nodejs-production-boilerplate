const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const i18n = require('../config/i18n');

/**
 * UploadUtils - File Upload Utility Class
 */
class UploadUtils {
  /**
   * Create Multer disk storage configuration
   */
  createStorage(directoryPath = 'uploads/default') {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        // Create directory if it doesn't exist
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.mkdirSync(directoryPath, { recursive: true });
        cb(null, directoryPath);
      },
      filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueName = `${file.fieldname}-${uuidv4()}-${moment().unix()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  /**
   * Create file uploader with validation
   */
  _createFileUploader(typeRegex, fileSize, directoryPath) {
    const storage = this.createStorage(directoryPath);

    return multer({
      storage,
      limits: { fileSize },
      fileFilter: (req, file, cb) => {
        const extname = typeRegex.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
          return cb(null, true);
        }

        return cb(new Error(i18n.__('error.invalidFileType')));
      },
    });
  }

  /**
   * Create configured file uploader
   */
  uploadFile(type = /jpg|jpeg|png|heic/, fileSize = 5 * 1024 * 1024, directoryPath = 'uploads/default') {
    return this._createFileUploader(type, fileSize, directoryPath);
  }

  /**
   * Middleware to set max file count limit
   */
  setMaxFileLimit(maxCount) {
    return (req, res, next) => {
      req.maxFileCount = maxCount;
      next();
    };
  }

  /**
   * Get default image upload configuration
   */
  getDefaultImageConfig() {
    return {
      type: /jpg|jpeg|png|heic/,
      maxSize: 5 * 1024 * 1024, // 5MB
      directory: 'uploads/default',
    };
  }

  /**
   * Get default video upload configuration
   */
  getDefaultVideoConfig() {
    return {
      type: /mp4|avi|mov|wmv/,
      maxSize: 50 * 1024 * 1024, // 50MB
      directory: 'uploads/videos',
    };
  }

  /**
   * Get default document upload configuration
   */
  getDefaultDocumentConfig() {
    return {
      type: /pdf|doc|docx|txt/,
      maxSize: 10 * 1024 * 1024, // 10MB
      directory: 'uploads/documents',
    };
  }
}

// Export singleton instance
module.exports = new UploadUtils();
