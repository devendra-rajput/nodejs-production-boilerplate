/**
 * User Routes
 * Defines all user-related API endpoints
 */

const express = require('express');
const userController = require('../resources/v1/users/users.controller');
const UserModel = require('../resources/v1/users/user.model');
const userValidation = require('../resources/v1/users/users.validation');
const { auth } = require('../middleware/v1/authorize');
const uploadUtils = require('../utils/upload');
const aws = require('../services/aws');

/**
 * Upload configuration constants
 */
const UPLOAD_CONFIG = {
  validExtensions: /jpg|jpeg|png|heic/,
  maxFileSize: 5 * 1024 * 1024, // 5 MB
  maxBulkFiles: 5,
};

/**
 * Get upload directory path
 */
const getUploadDirectory = () => {
  const date = new Date();
  return `uploads/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * Create file upload middleware
 * Higher-order function that creates upload middleware
 */
const createUploadMiddleware = (directory, fieldName = 'image', isMultiple = false) => {
  const upload = uploadUtils.uploadFile(
    UPLOAD_CONFIG.validExtensions,
    UPLOAD_CONFIG.maxFileSize,
    directory,
  );

  return isMultiple
    ? upload.array(fieldName, UPLOAD_CONFIG.maxBulkFiles)
    : upload.single(fieldName);
};

// Authentication routes (public)
const createAuthRoutes = (router) => {
  router.post(
    '/create',
    [
      createUploadMiddleware(getUploadDirectory()),
      userValidation.createOne,
    ],
    userController.createOne,
  );

  router.post(
    '/resend-otp',
    [userValidation.resendOtp],
    userController.resendOtp,
  );

  router.post(
    '/verify',
    [userValidation.verifyOtp],
    userController.verifyOtp,
  );

  router.post(
    '/login',
    [userValidation.userLogin],
    userController.userLogin,
  );

  router.post(
    '/forgot-password',
    [userValidation.forgotPassword],
    userController.forgotPassword,
  );

  router.post(
    '/forgot-password/verify-otp',
    [userValidation.verifyForgotPasswordOTP],
    userController.verifyForgotPasswordOTP,
  );

  router.post(
    '/reset-password',
    [userValidation.resetPassword],
    userController.resetPassword,
  );

  return router;
};

// Protected user routes
const createProtectedUserRoutes = (router) => {
  router.get(
    '/profile',
    [auth()],
    userController.getUserProfile,
  );

  router.post(
    '/change-password',
    [auth(), userValidation.changePassword],
    userController.changePassword,
  );

  router.get(
    '/logout',
    [auth()],
    userController.logout,
  );

  router.delete(
    '/',
    [auth()],
    userController.deleteOne,
  );

  return router;
};

// Image upload routes
const createImageUploadRoutes = (router) => {
  const uploadDir = getUploadDirectory();

  router.post(
    '/upload-image',
    [
      auth(),
      createUploadMiddleware(uploadDir),
    ],
    userController.uploadImage,
  );

  router.post(
    '/upload-bulk-images',
    [
      auth(),
      uploadUtils.setMaxFileLimit(UPLOAD_CONFIG.maxBulkFiles),
      createUploadMiddleware(uploadDir, 'images', true),
    ],
    userController.uploadBulkImages,
  );

  router.post(
    '/delete-image',
    [userValidation.deleteImage],
    userController.deleteImage,
  );

  return router;
};

// AWS S3 upload routes
const createAWSUploadRoutes = (router) => {
  router.post(
    '/upload-image-aws',
    [
      auth(),
      createUploadMiddleware('uploads/temp'),
      aws.uploadFile,
    ],
    userController.uploadImageAWS,
  );

  router.post(
    '/delete-image-aws',
    [userValidation.deleteImageAWS],
    userController.deleteImageAWS,
  );

  router.post(
    '/generate-aws-presigned-url',
    [auth(), userValidation.generatePresignedUrl],
    userController.generatePresignedUrl,
  );

  return router;
};

// Admin routes
const createAdminRoutes = (router) => {
  router.get(
    '/',
    [auth(UserModel.roles.ADMIN)],
    userController.getAllWithPagination,
  );

  return router;
};

/**
 * Initialize all user routes
 */
const initializeUserRoutes = () => {
  const router = express.Router();

  createAuthRoutes(router);
  createProtectedUserRoutes(router);
  createImageUploadRoutes(router);
  createAWSUploadRoutes(router);
  createAdminRoutes(router);

  return router;
};

/**
 * Export configured router
 */
module.exports = initializeUserRoutes();
