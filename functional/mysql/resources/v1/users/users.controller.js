/**
 * User Controller
 * Handles HTTP requests for user operations
 */

const path = require('path');
const fs = require('fs');

const response = require('../../../helpers/v1/response.helpers');
const dataHelper = require('../../../helpers/v1/data.helpers');
const UserModel = require('./user.model');

// Lazy load dependencies
// eslint-disable-next-line global-require
const getNodemailer = () => require('../../../services/nodemailer');
// eslint-disable-next-line global-require
const getAWS = () => require('../../../services/aws');
// eslint-disable-next-line global-require
const getSocketService = () => require('../../../services/socket');
// eslint-disable-next-line global-require
const getSocketEvents = () => require('../../../constants/socket_events');
// eslint-disable-next-line global-require
const getVerificationTemplate = () => require('../../../emailTemplates/v1/verification');
// eslint-disable-next-line global-require
const getForgotPasswordTemplate = () => require('../../../emailTemplates/v1/forgotPassword');

// Helper Functions

const filePathToURL = (req, filePath) => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return `${req.protocol}://${req.get('host')}/${normalizedPath}`;
};

const deleteLocalFile = (fileUrl) => {
  try {
    const filePath = new URL(fileUrl).pathname;
    const localPath = path.join(process.cwd(), filePath);

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (fs.existsSync(localPath)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      fs.unlinkSync(localPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error.message);
    return false;
  }
};

const sendEmailAsync = (email, subject, html) => {
  const nodemailer = getNodemailer();
  nodemailer.sendMail(email, subject, html).catch((error) => {
    console.error('Error sending email:', error.message);
  });
};

const getOTPSuccessMessage = (res, code) => {
  if (process.env.NODE_ENV === 'development') {
    return res.__('auth.emailCodeSentWithOtp', { code });
  }
  return res.__('auth.emailCodeSent');
};

/**
 * Create a new user
 */
const createOne = async (req, res) => {
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
    const isUserExist = await UserModel.isUserExist('email', email);
    if (isUserExist) {
      return response.conflict('error.emailExist', res, false);
    }

    // Hash password
    const hashedPassword = await dataHelper.hashPassword(password);

    // Generate OTP
    const emailVerificationOtp = await dataHelper.generateSecureOTP(6);

    // Prepare user data
    let userData = {
      email,
      password: hashedPassword,
      first_name,
      last_name,
      email_verification_otp: emailVerificationOtp,
    };

    if (phone_code && phone_number) {
      userData = {
        ...userData,
        phone_code,
        phone_number,
      };
    }

    if (req?.file?.path) {
      const fileUrl = filePathToURL(req, req.file.path);
      userData = {
        ...userData,
        profile_picture: fileUrl,
      };
    }

    // Create user
    const hasCreated = await UserModel.createOne(userData);
    if (!hasCreated) {
      // Cleanup uploaded file if user creation failed
      if (userData?.profile_picture) {
        deleteLocalFile(userData.profile_picture);
      }
      return response.exception('error.serverError', res, false);
    }

    // Send verification email asynchronously
    const verificationTemplate = getVerificationTemplate();
    const html = await verificationTemplate(emailVerificationOtp);
    sendEmailAsync(email, 'Account Verification', html);

    const successMessage = getOTPSuccessMessage(res, emailVerificationOtp);
    return response.created(successMessage, res, true);
  } catch (error) {
    console.error('UserController@createOne Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Resend OTP
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await UserModel.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    if (user.is_email_verified) {
      return response.badRequest('error.emailAlreadyVerified', res, false);
    }

    // Generate OTP
    const emailVerificationOtp = await dataHelper.generateSecureOTP(6);

    const userDataToUpdate = {
      email_verification_otp: emailVerificationOtp,
    };

    const hasUpdated = await UserModel.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    // Send verification email asynchronously
    const verificationTemplate = getVerificationTemplate();
    const html = await verificationTemplate(emailVerificationOtp);
    sendEmailAsync(email, 'Account Verification', html);

    const successMessage = getOTPSuccessMessage(res, emailVerificationOtp);
    return response.success(successMessage, res, true);
  } catch (error) {
    console.error('UserController@resendOtp Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Verify OTP
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await UserModel.getOneByColumnNameAndValue('email', email, true);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    console.log(user.email_verification_otp, otp);
    if (!user?.email_verification_otp || user.email_verification_otp !== String(otp)) {
      return response.badRequest('error.invalidOtp', res, false);
    }

    // Generate JWT token
    const tokenData = {
      user_id: user.id,
      role: user.role,
    };
    const token = await dataHelper.generateJWTToken(tokenData);

    const userDataToUpdate = {
      auth_token: token,
      fcm_token: req.headers['fcm-token'],
      email_verification_otp: null,
      is_email_verified: true,
    };

    const updatedUser = await UserModel.updateOne(user.id, userDataToUpdate);
    if (!updatedUser) {
      return response.exception('error.serverError', res, null);
    }

    const formattedUserData = UserModel.getFormattedData(updatedUser);

    const result = {
      token,
      user: formattedUserData,
    };

    return response.success('auth.otpVerified', res, result);
  } catch (error) {
    console.error('UserController@verifyOtp Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * User Login
 */
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await UserModel.getOneByColumnNameAndValue('email', email, true);
    if (!user) {
      return response.badRequest('auth.invalidCredentails', res, false);
    }

    // Validate password
    const isValidPassword = await dataHelper.validatePassword(password, user.password);
    if (!isValidPassword) {
      return response.badRequest('auth.invalidCredentails', res, false);
    }

    // Generate JWT token
    const tokenData = {
      user_id: user.id,
      role: user.role,
    };
    const token = await dataHelper.generateJWTToken(tokenData);

    const userData = {
      auth_token: token,
      fcm_token: req.headers['fcm-token'],
    };

    const updatedUser = await UserModel.updateOne(user.id, userData);
    if (!updatedUser) {
      return response.exception('error.serverError', res, null);
    }

    const formattedUserData = UserModel.getFormattedData(updatedUser);

    const result = {
      token,
      user: formattedUserData,
    };

    return response.success('auth.loggedIn', res, result);
  } catch (error) {
    console.error('UserController@userLogin Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Change Password
 */
const changePassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    const { user } = req;

    // Hash password
    const hashedPassword = await dataHelper.hashPassword(new_password);

    const userDataToUpdate = {
      password: hashedPassword,
    };

    const hasUpdated = await UserModel.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.passwordChanged', res, true);
  } catch (error) {
    console.error('UserController@changePassword Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Forgot Password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await UserModel.getOneByColumnNameAndValue('email', email);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    // Generate OTP
    const forgotPasswordVerificationOtp = await dataHelper.generateSecureOTP(6);

    const userDataToUpdate = {
      forgot_password_otp: forgotPasswordVerificationOtp,
    };

    const hasUpdated = await UserModel.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    // Send verification email asynchronously
    const forgotPasswordTemplate = getForgotPasswordTemplate();
    const html = await forgotPasswordTemplate(forgotPasswordVerificationOtp);
    sendEmailAsync(email, 'Forgot Password Verification', html);

    const successMessage = getOTPSuccessMessage(res, forgotPasswordVerificationOtp);
    return response.success(successMessage, res, true);
  } catch (error) {
    console.error('UserController@forgotPassword Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Verify Forgot Password OTP
 */
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user
    const user = await UserModel.getOneByColumnNameAndValue('email', email, true);
    if (!user) {
      return response.badRequest('error.invalidEmail', res, false);
    }

    if (!user?.forgot_password_otp || user.forgot_password_otp !== String(otp)) {
      return response.badRequest('error.invalidOtp', res, false);
    }

    const userDataToUpdate = {
      email_verification_otp: null,
      forgot_password_otp: null,
      is_email_verified: true,
    };

    const hasUpdated = await UserModel.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    const result = {
      user: {
        id: user.id,
      },
    };

    return response.success('auth.otpVerified', res, result);
  } catch (error) {
    console.error('UserController@verifyForgotPasswordOTP Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
  try {
    const { password, user_id } = req.body;

    const user = await UserModel.getOneByColumnNameAndValue('id', user_id, true);
    if (!user) {
      return response.badRequest('error.userNotExist', res, false);
    }

    if (user?.forgot_password_otp) {
      return response.badRequest('error.otpNotVerified', res, false);
    }

    // Hash password
    const hashedPassword = await dataHelper.hashPassword(password);

    const userDataToUpdate = {
      password: hashedPassword,
    };

    const hasUpdated = await UserModel.updateOne(user.id, userDataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.passwordChanged', res, true);
  } catch (error) {
    console.error('UserController@resetPassword Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (req, res) => {
  try {
    const { user } = req;

    // Emit socket event asynchronously
    const socketService = getSocketService();
    const socketEvents = getSocketEvents();
    socketService.emitToUsers([user.id], socketEvents.EMIT.USER_PROFILE_VIEWED, {
      message: 'Profile viewed',
      time: new Date(),
    });

    const formattedUserData = UserModel.getFormattedData(user);

    return response.success('success.userProfile', res, formattedUserData);
  } catch (error) {
    console.error('UserController@getUserProfile Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Get all users with pagination
 */
const getAllWithPagination = async (req, res) => {
  try {
    // Extract page and limit
    const { page, limit } = await dataHelper.getPageAndLimit(req.query);

    const filterObj = {
      role: UserModel.USER_ROLES.USER,
    };

    const result = await UserModel.getAllWithPagination(page, limit, filterObj);

    if (!result?.data?.length) {
      return response.success('success.noRecordsFound', res, result);
    }

    return response.success('success.usersData', res, result);
  } catch (error) {
    console.error('UserController@getAllWithPagination Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { user } = req;

    const dataToUpdate = {
      auth_token: '',
      fcm_token: '',
    };

    const hasUpdated = await UserModel.updateOne(user.id, dataToUpdate);
    if (!hasUpdated) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.logoutSuccess', res, true);
  } catch (error) {
    console.error('UserController@logout Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Delete user account
 */
const deleteOne = async (req, res) => {
  try {
    const { user } = req;

    // Soft delete with timestamp
    const dataToUpdate = {
      deleted_at: new Date().toISOString().replace('Z', '+00:00'),
    };

    const hasDeleted = await UserModel.updateOne(user.id, dataToUpdate);
    if (!hasDeleted) {
      return response.exception('error.serverError', res, null);
    }

    return response.success('auth.deleteAccount', res, true);
  } catch (error) {
    console.error('UserController@deleteOne Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Upload single image
 */
const uploadImage = async (req, res) => {
  try {
    if (!req?.file?.path) {
      return response.badRequest('error.fileNotUploaded', res, false);
    }

    const fileUrl = filePathToURL(req, req.file.path);

    return response.success('success.fileUploaded', res, { image_url: fileUrl });
  } catch (error) {
    console.error('UserController@uploadImage Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Upload multiple images
 */
const uploadBulkImages = async (req, res) => {
  try {
    const { files } = req;
    if (!files?.length) {
      return response.badRequest('error.fileNotUploaded', res, false);
    }

    const imageUrls = files.map((file) => filePathToURL(req, file.path));

    return response.success('success.fileUploaded', res, { image_urls: imageUrls });
  } catch (error) {
    console.error('UserController@uploadBulkImages Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Delete uploaded image
 */
const deleteImage = async (req, res) => {
  try {
    const { image_url } = req.body;

    const hasDeleted = deleteLocalFile(image_url);
    if (!hasDeleted) {
      return response.badRequest('error.fileNotFound', res, false);
    }

    return response.success('success.fileDeleted', res, true);
  } catch (error) {
    console.error('UserController@deleteImage Error:', error.message);
    return response.exception('error.invalidFileUrlToDelete', res, false);
  }
};

/**
 * Upload image to AWS S3
 */
const uploadImageAWS = async (req, res) => {
  try {
    return response.success('success.fileUploaded', res, { image_url: req.image_url });
  } catch (error) {
    console.error('UserController@uploadImageAWS Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Delete image from AWS S3
 */
const deleteImageAWS = async (req, res) => {
  try {
    const { image_url } = req.body;

    const aws = getAWS();
    const hasDeleted = await aws.deleteFile(image_url);
    if (!hasDeleted) {
      return response.badRequest('error.fileNotFound', res, false);
    }

    return response.success('success.fileDeleted', res, true);
  } catch (error) {
    console.error('UserController@deleteImageAWS Error:', error.message);
    return response.exception('error.serverError', res, false);
  }
};

/**
 * Generate AWS Presigned URL
 */
const generatePresignedUrl = async (req, res) => {
  try {
    const { file_name, file_type, folder = 'uploads' } = req.body;

    const aws = getAWS();
    const result = await aws.getPresignedUrl(folder, file_name, file_type);
    if (!result) {
      return response.badRequest('error.serverError', res, false);
    }

    return response.success('success.presignedUrlGenerated', res, result);
  } catch (error) {
    console.error('UserController@generatePresignedUrl Error:', error.message);
    return response.exception('error.serverError', res, null);
  }
};

module.exports = {
  createOne,
  resendOtp,
  verifyOtp,
  userLogin,
  changePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  getUserProfile,
  getAllWithPagination,
  logout,
  deleteOne,
  uploadImage,
  uploadBulkImages,
  deleteImage,
  uploadImageAWS,
  deleteImageAWS,
  generatePresignedUrl,
};
