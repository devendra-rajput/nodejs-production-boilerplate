const { BaseRoute } = require('../core');
const userController = require('../resources/v1/users/users.controller');
const UserModel = require('../resources/v1/users/users.model');
const userValidation = require('../resources/v1/users/users.validation');
const authMiddleware = require('../middleware/v1/authorize');
const uploadUtils = require('../utils/upload');
const aws = require('../services/aws');

/**
 * UserRoute - Extends BaseRoute
 *
 * Handles all user-related routes
 * Demonstrates:
 * - Inheritance: Extends BaseRoute
 * - Organization: Clean route definitions
 * - Maintainability: Easy to read and modify
 */
class UserRoute extends BaseRoute {
  constructor() {
    super('UserRoute');

    // Upload configuration
    this.uploadConfig = {
      validExtensions: /jpg|jpeg|png|heic/,
      maxFileSize: 5 * 1024 * 1024, // 5 MB
      uploadDirectory: this._getUploadDirectory(),
    };

    // Initialize routes
    this.initializeRoutes();
  }

  /**
   * Get upload directory based on current date
   * @private
   */
  _getUploadDirectory() {
    const dateObj = new Date();
    return `uploads/${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  }

  /**
   * Initialize all user routes
   * @override
   */
  initializeRoutes() {
    this._log('Initializing routes');

    // Public routes (no auth required)
    this._initializePublicRoutes();

    // Protected routes (auth required)
    this._initializeProtectedRoutes();

    // Admin routes
    this._initializeAdminRoutes();

    // Image upload routes
    this._initializeImageRoutes();
  }

  /**
   * Initialize public routes
   * @private
   */
  _initializePublicRoutes() {
    // User registration
    this.post(
      '/create',
      [
        uploadUtils.uploadFile(
          this.uploadConfig.validExtensions,
          this.uploadConfig.maxFileSize,
          this.uploadConfig.uploadDirectory,
        ).single('image'),
        userValidation.createOne,
      ],
      userController.createOne,
    );

    // Authentication routes
    this.post('/login', [userValidation.userLogin], userController.userLogin);
    this.post('/resend-otp', [userValidation.resendOtp], userController.resendOtp);
    this.post('/verify', [userValidation.verifyOtp], userController.verifyOtp);

    // Password recovery routes
    this.post('/forgot-password', [userValidation.forgotPassword], userController.forgotPassword);
    this.post('/forgot-password/verify-otp', [userValidation.verifyForgotPasswordOTP], userController.verifyForgotPasswordOTP);
    this.post('/reset-password', [userValidation.resetPassword], userController.resetPassword);
  }

  /**
   * Initialize protected routes (require authentication)
   * @private
   */
  _initializeProtectedRoutes() {
    // Profile routes
    this.get('/profile', [authMiddleware.auth()], userController.getUserProfile);
    this.get('/logout', [authMiddleware.auth()], userController.logout);

    // Password management
    this.post(
      '/change-password',
      [authMiddleware.auth(), userValidation.changePassword],
      userController.changePassword,
    );

    // Account deletion
    this.delete('/', [authMiddleware.auth()], userController.deleteOne);
  }

  /**
   * Initialize admin routes
   * @private
   */
  _initializeAdminRoutes() {
    // Get all users (admin only)
    this.get(
      '/',
      [authMiddleware.auth(UserModel.roles.ADMIN)],
      userController.getAllWithPagination,
    );
  }

  /**
   * Initialize image upload routes
   * @private
   */
  _initializeImageRoutes() {
    const { validExtensions, maxFileSize, uploadDirectory } = this.uploadConfig;

    // Single image upload
    this.post(
      '/upload-image',
      [
        authMiddleware.auth(),
        uploadUtils.uploadFile(validExtensions, maxFileSize, uploadDirectory).single('image'),
      ],
      userController.uploadImage,
    );

    // Bulk image upload
    this.post(
      '/upload-bulk-images',
      [
        authMiddleware.auth(),
        uploadUtils.setMaxFileLimit(5),
        uploadUtils.uploadFile(validExtensions, maxFileSize, uploadDirectory).array('images', 5),
      ],
      userController.uploadBulkImages,
    );

    // Delete image
    this.post('/delete-image', [userValidation.deleteImage], userController.deleteImage);

    // AWS S3 routes
    this.post(
      '/upload-image-aws',
      [
        authMiddleware.auth(),
        uploadUtils.uploadFile(validExtensions, maxFileSize, 'uploads/temp').single('image'),
        aws.uploadFile,
      ],
      userController.uploadImageAWS,
    );

    this.post(
      '/delete-image-aws',
      [userValidation.deleteImageAWS],
      userController.deleteImageAWS,
    );

    this.post(
      '/generate-aws-presigned-url',
      [authMiddleware.auth(), userValidation.generatePresignedUrl],
      userController.generatePresignedUrl,
    );
  }
}

// Export router instance
module.exports = new UserRoute().getRouter();
