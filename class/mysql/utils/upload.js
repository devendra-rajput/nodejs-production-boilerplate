const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const i18n = require('../config/i18n');

/**
 * UploadUtils - File Upload Utility Class
 *
 * Handles file upload configuration using Multer
 * Follows OOP principles:
 * - Encapsulation: Upload logic in one class
 * - Single Responsibility: Only handles file uploads
 * - Reusability: Configurable upload settings
 */
class UploadUtils {
  /**
   * Create Multer disk storage configuration
   * @param {string} directoryPath - Upload directory path
   * @returns {multer.StorageEngine}
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
   * @private
   * @param {RegExp} typeRegex - Allowed file type regex
   * @param {number} fileSize - Max file size in bytes
   * @param {string} directoryPath - Upload directory
   * @returns {multer.Multer}
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
   * @param {RegExp} type - File type regex (default: /jpg|jpeg|png|heic/)
   * @param {number} fileSize - Max file size in bytes (default: 5MB)
   * @param {string} directoryPath - Upload directory (default: 'uploads/default')
   * @returns {multer.Multer}
   */
  uploadFile(type = /jpg|jpeg|png|heic/, fileSize = 5 * 1024 * 1024, directoryPath = 'uploads/default') {
    return this._createFileUploader(type, fileSize, directoryPath);
  }

  /**
   * Middleware to set max file count limit
   * @param {number} maxCount - Maximum number of files
   * @returns {Function} Express middleware
   */
  setMaxFileLimit(maxCount) {
    return (req, res, next) => {
      req.maxFileCount = maxCount;
      next();
    };
  }

  /**
   * Get default image upload configuration
   * @returns {Object} Upload configuration
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
   * @returns {Object} Upload configuration
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
   * @returns {Object} Upload configuration
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
