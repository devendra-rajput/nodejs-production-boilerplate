const path = require('path');
const fs = require('fs');

/** Custom Require * */
const { BaseController } = require('../../../core');
const response = require('../../../helpers/v1/response.helpers');
const dataHelper = require('../../../helpers/v1/data.helpers');
const nodemailer = require('../../../services/nodemailer');
const UserResource = require('../users/users.resource');
const aws = require('../../../services/aws');
const socketService = require('../../../services/socket');
const socketEvents = require('../../../constants/socket_events');

const verificationTemplate = require('../../../emailTemplates/v1/verification');
const forgotPasswordTemplate = require('../../../emailTemplates/v1/forgotPassword');

/**
 * UserController - Extends BaseController
 *
 * Implements user-specific business logic and request handling
 * Demonstrates:
 * - Inheritance: Extends BaseController
 * - Dependency Injection: Injects UserResource and response helpers
 * - Encapsulation: Uses protected methods from base class
 * - Single Responsibility: Handles only user-related requests
 */
class UserController extends BaseController {
  constructor() {
    // Call parent constructor with resource, response, and dataHelper
    super(UserResource, response, dataHelper);

    // Inject additional dependencies (response and dataHelper already in parent)
    this.nodemailer = nodemailer;
    this.aws = aws;
    this.socketService = socketService;

    // Automatically bind all public methods to preserve 'this' context
    // This is necessary because Express passes methods as callbacks
    this._autoBindMethods();
  }

  /**
   * Create a new user - Uses BaseController helpers
   * Overrides base create() with custom user registration logic
   */
  createOne = async (req, res) => {
    this._logAction('createOne', { email: req.body.email }); // Use base helper

    try {
      const {
        first_name,
        last_name,
        email,
        password,
        phone_number,
        phone_code,
      } = req.body;

      // Check if user exists
      const isUserExist = await this.resource.isUserExist('email', email);
      if (isUserExist) {
        return this.response.conflict('error.emailExist', res, false);
      }

      // Hash password
      const hashedPassword = await this.dataHelper.hashPassword(password);

      // Generate OTP
      const emailVerificationOtp = await this.dataHelper.generateSecureOTP(6);

      // Prepare user data
      let userData = {
        email,
        password: hashedPassword,
        first_name,
        last_name,
        email_verification_otp: emailVerificationOtp,
      };

      if (phone_code && phone_number) {
        userData = { ...userData, phone_code, phone_number };
      }

      if (req?.file?.path) {
        const filePath = req.file.path.replace(/\\/g, '/');
        const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
        userData = { ...userData, profile_picture: fileUrl };
      }

      // Create user
      const hasCreated = await this.resource.createOne(userData);
      if (!hasCreated) {
        // Cleanup uploaded file if user creation failed
        if (userData?.profile_picture) {
          const filePath = new URL(userData.profile_picture).pathname;
          const localPath = path.join(process.cwd(), filePath);
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          if (fs.existsSync(localPath)) {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs.unlinkSync(localPath);
          }
        }
        return this.response.exception('error.serverError', res, false);
      }

      // Send verification email
      try {
        const subject = 'Account Verification';
        const html = await verificationTemplate(emailVerificationOtp);
        this.nodemailer.sendMail(email, subject, html);
      } catch (error) {
        console.log('Error while sending verification email: ', error);
      }

      // Use environment-specific message
      let successMessage;
      if (process.env.NODE_ENV === 'development') {
        successMessage = res.__('auth.emailCodeSentWithOtp', { code: emailVerificationOtp });
      } else {
        successMessage = res.__('auth.emailCodeSent');
      }

      return this.response.created(successMessage, res, true);
    } catch (error) {
      return this._handleError(error, res, this.response); // Use base helper
    }
  }

  resendOtp = async (req, res) => {
    this._logAction('resendOtp');

    const { email } = req.body;

    /** Find the user br given email */
    const user = await this.resource.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    if (user.is_email_verified) {
      return response.badRequest('error.emailAlreadyVerified', res, false);
    }

    /* Generate OTP to verify the user email  */
    const emailVerificationOtp = await this.dataHelper.generateSecureOTP(6);

    const userDataToUpdate = {
      email_verification_otp: emailVerificationOtp,
    };
    const hasUpdated = await this.resource.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    /** Send verification email */
    try {
      const subject = 'Account Verification';
      const html = await verificationTemplate(emailVerificationOtp);
      nodemailer.sendMail(email, subject, html);
    } catch (error) {
      console.log('Error while sending verification email: ', error);
    }

    let successMessage;
    if (process.env.NODE_ENV === 'development') {
      // Development: include the verification code in the message
      successMessage = res.__('auth.emailCodeSentWithOtp', { code: emailVerificationOtp });
    } else {
      // Production: standard message without exposing the code
      successMessage = res.__('auth.emailCodeSent');
    }

    return response.success(successMessage, res, true);
  };

  verifyOtp = async (req, res) => {
    this._logAction('verifyOtp');

    const { email, otp } = req.body;

    /** Find the user br given email */
    const user = await this.resource.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    if (!user?.email_verification_otp || user.email_verification_otp !== otp) {
      return response.badRequest('error.invalidOtp', res, false);
    }

    /** Generate the JWT token and insert it into the DB */
    const tokenData = {
      user_id: user.id,
      role: user.role,
    };
    const token = await this.dataHelper.generateJWTToken(tokenData);

    const userDataToUpdate = {
      tokens: {
        auth_token: token,
        fcm_token: req.headers['fcm-token'],
      },
      email_verification_otp: null,
      is_email_verified: true,
    };
    const hasUpdated = await this.resource.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    const formatedUserData = await this.resource.getFormattedData(user);

    const result = {
      token,
      user: formatedUserData,
    };

    return response.success('auth.otpVerified', res, result);
  };

  userLogin = async (req, res) => {
    this._logAction('userLogin');

    const { email, password } = req.body;

    /** Find the user br given email */
    const user = await this.resource.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('auth.invalidCredentails', res, false);
    }

    /** Validate the password */
    const isValidPassword = await this.dataHelper.validatePassword(password, user.password);
    if (!isValidPassword) {
      return response.badRequest('auth.invalidCredentails', res, false);
    }

    /** Generate the JWT token and insert it into the DB */
    const tokenData = {
      user_id: user.id,
      role: user.role,
    };
    const token = await this.dataHelper.generateJWTToken(tokenData);

    const userData = {
      auth_token: token,
      fcm_token: req.headers['fcm-token']
    };
    const hasUpdated = await this.resource.updateOne(user.id, userData);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    const formatedUserData = await this.resource.getFormattedData(user);

    const result = {
      token,
      user: formatedUserData,
    };
    return response.success('auth.loggedIn', res, result);
  };

  changePassword = async (req, res) => {
    this._logAction('changePassword');

    const { new_password } = req.body;
    const { user } = req;

    /* Convert password string into a hash  */
    const hashedPassword = await this.dataHelper.hashPassword(new_password);

    /** Update new password in DB */
    const userDataToUpdate = {
      password: hashedPassword,
    };
    const hasUpdated = await this.resource.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.passwordChanged', res, true);
  };

  forgotPassword = async (req, res) => {
    this._logAction('forgotPassword');

    const { email } = req.body;

    /** Find the user br given email */
    const user = await this.resource.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    /* Generate OTP to verify the user email  */
    const forgotPasswordVerificationOtp = await this.dataHelper.generateSecureOTP(6);

    const userDataToUpdate = {
      forgot_password_otp: forgotPasswordVerificationOtp
    };
    const hasUpdated = await this.resource.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    /** Send verification email */
    try {
      const subject = 'Forgot Password Verification';
      const html = await forgotPasswordTemplate(forgotPasswordVerificationOtp);
      nodemailer.sendMail(email, subject, html);
    } catch (error) {
      console.log('Error while sending verification email: ', error);
    }

    let successMessage;
    if (process.env.NODE_ENV === 'development') {
      // Development: include the verification code in the message
      successMessage = res.__('auth.emailCodeSentWithOtp', {
        code: forgotPasswordVerificationOtp,
      });
    } else {
      // Production: standard message without exposing the code
      successMessage = res.__('auth.emailCodeSent');
    }

    return response.success(successMessage, res, true);
  };

  verifyForgotPasswordOTP = async (req, res) => {
    this._logAction('verifyForgotPasswordOTP');

    const { email, otp } = req.body;

    /** Find the user br given email */
    const user = await this.resource.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    if (!user?.forgot_password_otp || user.forgot_password_otp !== otp) {
      return response.badRequest('error.invalidOtp', res, false);
    }

    const userDataToUpdate = {
      email_verification_otp: null,
      forgot_password_otp: null,
      is_email_verified: true
    };

    const hasUpdated = await this.resource.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    const result = {
      user: {
        id: user.id,
      },
    };

    return response.success('auth.otpVerified', res, result);
  };

  resetPassword = async (req, res) => {
    this._logAction('resetPassword');

    const { password, user_id } = req.body;

    const user = await this.resource.getOneByColumnNameAndValue('id', user_id);
    if (!user) {
      return response.badRequest('error.userNotExist', res, false);
    }

    if (user?.forgot_password_otp) {
      return response.badRequest('error.otpNotVerified', res, false);
    }

    /* Convert password string into a hash  */
    const hashedPassword = await this.dataHelper.hashPassword(password);

    /** Update new password in DB */
    const userDataToUpdate = {
      password: hashedPassword,
    };

    const hasUpdated = await this.resource.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.passwordChanged', res, true);
  };

  /**
   * Get user profile - Uses BaseController helpers
   */
  getUserProfile = async (req, res) => {
    this._logAction('getUserProfile'); // Use base helper

    try {
      const { user } = req;

      // Emit socket event
      this.socketService.emitToUsers([user.id], socketEvents.EMIT.USER_PROFILE_VIEWED, {
        message: 'Profile viewed',
        time: new Date(),
      });

      const formattedUserData = await this.resource.getFormattedData(user);
      return this.response.success('success.userProfile', res, formattedUserData);
    } catch (error) {
      return this._handleError(error, res, this.response); // Use base helper
    }
  }

  /**
   * Get all users with pagination - Uses BaseController helpers
   * Could also use: return await super.getAll(req, res);
   * But this shows custom filtering
   */
  getAllWithPagination = async (req, res) => {
    this._logAction('getAllWithPagination'); // Use base helper

    try {
      // Extract pagination params using base helper
      const { page, limit } = await this._getPaginationParams(req.query, this.dataHelper);

      // Custom filter for users only (not admins)
      const filterObj = {
        role: this.resource.roles.USER,
      };

      const result = await this.resource.getAllWithPagination(page, limit, filterObj);

      if (!result?.data?.length) {
        return this.response.success('success.noRecordsFound', res, result);
      }

      // Use base helper for success message
      return this.response.success('success.usersData', res, result);
    } catch (error) {
      return this._handleError(error, res, this.response); // Use base helper
    }
  }

  /**
   * Logout user - Uses BaseController helpers
   */
  logout = async (req, res) => {
    this._logAction('logout'); // Use base helper

    try {
      const { user } = req;

      const dataToUpdate = {
        auth_token: '',
        fcm_token: '',
      };

      const hasUpdated = await this.resource.updateOne(user.id, dataToUpdate);
      if (!hasUpdated) {
        return this.response.exception('error.serverError', res, null);
      }

      return this.response.success('auth.logoutSuccess', res, true);
    } catch (error) {
      return this._handleError(error, res, this.response); // Use base helper
    }
  }

  deleteOne = async (req, res) => {
    this._logAction('deleteOne'); // Use base helper

    const { user } = req;

    // convert date into format example -2025-07-03T09:48:05.031+00:00
    const dataToUpdate = {
      deleted_at: new Date().toISOString().replace('Z', '+00:00'),
    };

    const hasDeleted = await this.resource.updateOne(user.id, dataToUpdate);
    if (!hasDeleted) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.deleteAccount', res, true);
  };

  uploadImage = async (req, res) => {
    this._logAction('uploadImage'); // Use base helper

    if (!req?.file?.path) {
      return response.badRequest('error.fileNotUploaded', res, false);
    }

    /** Convert file path into a public URL */
    const filePath = req.file.path.replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;

    return response.success('success.fileUploaded', res, { image_url: fileUrl });
  };

  uploadBulkImages = async (req, res) => {
    this._logAction('uploadBulkImages'); // Use base helper

    const { files } = req;
    if (!files?.length) {
      return response.badRequest('error.fileNotUploaded', res, false);
    }

    /** Convert file paths into public URLs */
    const imageUrls = await files.map((file) => {
      const filePath = file.path.replace(/\\/g, '/');
      return `${req.protocol}://${req.get('host')}/${filePath}`;
    });

    return response.success('success.fileUploaded', res, { image_urls: imageUrls });
  };

  deleteImage = async (req, res) => {
    this._logAction('deleteImage'); // Use base helper

    try {
      const { image_url } = req.body;

      const filePath = new URL(image_url).pathname; // e.g., /uploads/images/filename.jpg
      const localPath = path.join(process.cwd(), filePath); // adjust path as needed

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(localPath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlinkSync(localPath);
        return response.success('success.fileDeleted', res, true);
      }
      return response.badRequest('error.fileNotFound', res, false);
    } catch (err) {
      return response.exception('error.invalidFileUrlToDelete', res, false);
    }
  };

  uploadImageAWS = async (req, res) => {
    this._logAction('uploadImageAWS'); // Use base helper

    return response.success('success.fileUploaded', res, { image_url: req.image_url });
  };

  deleteImageAWS = async (req, res) => {
    this._logAction('deleteImageAWS'); // Use base helper

    const { image_url } = req.body;

    const hasDeleted = await this.aws.deleteFile(image_url);
    if (!hasDeleted) {
      return response.badRequest('error.fileNotFound', res, false);
    }

    return response.success('success.fileDeleted', res, true);
  };

  generatePresignedUrl = async (req, res) => {
    this._logAction('generatePresignedUrl'); // Use base helper

    const { file_name, file_type, folder = 'uploads' } = req.body;

    try {
      const result = await this.aws.getPresignedUrl(folder, file_name, file_type);
      if (!result) {
        return response.badRequest('error.serverError', res, false);
      }

      return response.success('success.presignedUrlGenerated', res, result);
    } catch (error) {
      return response.exception('error.serverError', res, null);
    }
  };
}

module.exports = new UserController();
