const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');

/** Custom Require * */
const i18n = require('../config/i18n');

// Create a Multer disk storage configuration
const createStorage = (directoryPath = 'uploads/default') => multer.diskStorage({
  destination: (req, file, cb) => {
    // Create the directory if it doesn't exist
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.mkdirSync(directoryPath, { recursive: true });
    cb(null, directoryPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique file name using current timestamp
    cb(null, `${file.fieldname}-${uuidv4()}-${moment().unix()}${path.extname(file.originalname)}`);
  },
});

// Create a general-purpose uploader with file type and size validation
const fileUploader = (typeRegex, fileSize, directoryPath) => {
  const storage = createStorage(directoryPath);
  return multer({
    storage,
    limits: { fileSize },
    fileFilter: (req, file, cb) => {
      const extname = typeRegex.test(path.extname(file.originalname).toLowerCase());
      return extname ? cb(null, true) : cb(i18n.__('error.invalidFileType'));
    },
  });
};

/**
 *
 * @param { /jpg|jpeg|png|heic/ } type
 * @param { 5 MB } fileSize
 * @param { Default uploads path} directoryPath
 * @returns
 */
const uploadFile = (type = /jpg|jpeg|png|heic/, fileSize = 5 * 1024 * 1024, directoryPath = 'uploads/default') => fileUploader(type, fileSize, directoryPath);

const setMaxFileLimit = (maxCount) => (req, res, next) => {
  req.maxFileCount = maxCount;
  next();
};

// Export all functions
module.exports = {
  uploadFile,
  setMaxFileLimit,
};
