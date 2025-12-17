const path = require('path');
const fs = require('fs');

/** Custom Require * */
const response = require('../../../helpers/v1/response.helpers');
const dataHelper = require('../../../helpers/v1/data.helpers');
const nodemailer = require('../../../services/nodemailer');
const UserModel = require('./users.model');
const aws = require('../../../services/aws');
const socketService = require('../../../services/socket');
const socketEvents = require('../../../constants/socket_events');

const verificationTemplate = require('../../../emailTemplates/v1/verification');
const forgotPasswordTemplate = require('../../../emailTemplates/v1/forgotPassword');

const createOne = async (req, res) => {
  console.log('UsersController@createOne');

  /* Collect the user input  */
  const {
    first_name,
    last_name,
    email,
    password,
    phone_number,
    phone_code,
  } = req.body;

  /** Check that the user already exist or not with the provided email */
  const isUserExist = await UserModel.isUserExist('email', email);
  if (isUserExist) {
    return response.conflict('error.emailExist', res, false);
  }

  /* Convert password string into a hash  */
  const hashedPassword = await dataHelper.hashPassword(password);

  /* Generate OTP to verify the user email  */
  const emailVerificationOtp = await dataHelper.generateSecureOTP(6);

  /* Formated the data to insert in DB */
  let userData = {
    email,
    password: hashedPassword,
    user_info: {
      first_name,
      last_name,
    },
    otp: {
      email_verification: emailVerificationOtp,
    },
  };

  if (phone_code && phone_number) {
    userData = {
      ...userData,
      phone_code,
      phone_number,
    };
  }

  if (req?.file?.path) {
    /** Convert file path into a public URL */
    const filePath = req.file.path.replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;
    userData = {
      ...userData,
      profile_picture: fileUrl,
    };
  }

  /* Insert the data into DB */
  const hasCreated = await UserModel.createOne(userData);
  if (!hasCreated) {
    /** If unable to create user then delete the uploaded file */
    if (userData?.profile_picture) {
      // e.g., /uploads/images/filename.jpg
      const filePath = new URL(userData.profile_picture).pathname;
      // adjust path as needed. process.cwd() returns root directory
      const localPath = path.join(process.cwd(), filePath);

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (fs.existsSync(localPath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        fs.unlinkSync(localPath);
      }
    }

    return response.exception('error.serverError', res, false);
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

  return response.created(successMessage, res, true);
};

const resendOtp = async (req, res) => {
  console.log('UsersController@resendOtp');

  const { email } = req.body;

  /** Find the user br given email */
  const user = await UserModel.getOneByColumnNameAndValue('email', email);
  if (!user) {
    return response.badRequest('error.invalidEmail', res, false);
  }

  if (user.is_email_verified) {
    return response.badRequest('error.emailAlreadyVerified', res, false);
  }

  /* Generate OTP to verify the user email  */
  const emailVerificationOtp = await dataHelper.generateSecureOTP(6);

  const userDataToUpdate = {
    otp: {
      email_verification: emailVerificationOtp,
    },
  };
  const hasUpdated = await UserModel.updateOne(user._id, userDataToUpdate);
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

const verifyOtp = async (req, res) => {
  console.log('UsersController@verifyOtp');

  const { email, otp } = req.body;

  /** Find the user br given email */
  const user = await UserModel.getOneByColumnNameAndValue('email', email);
  if (!user) {
    return response.badRequest('error.invalidEmail', res, false);
  }

  if (!user?.otp?.email_verification || user.otp.email_verification !== String(otp)) {
    return response.badRequest('error.invalidOtp', res, false);
  }

  /** Generate the JWT token and insert it into the DB */
  const tokenData = {
    user_id: user._id,
    role: user.role,
  };
  const token = await dataHelper.generateJWTToken(tokenData);

  const userDataToUpdate = {
    tokens: {
      auth_token: token,
      fcm_token: req.headers['fcm-token'],
    },
    otp: {
      email_verification: null,
    },
    is_email_verified: true,
  };
  const hasUpdated = await UserModel.updateOne(user._id, userDataToUpdate);
  if (!hasUpdated) {
    return response.exception('error.serverError', res, null);
  }

  const formatedUserData = await UserModel.getFormattedData(user);

  const result = {
    token,
    user: formatedUserData,
  };

  return response.success('auth.otpVerified', res, result);
};

const userLogin = async (req, res) => {
  console.log('UsersController@userlogin');

  const { email, password } = req.body;

  /** Find the user br given email */
  const user = await UserModel.getOneByColumnNameAndValue('email', email);
  if (!user) {
    return response.badRequest('auth.invalidCredentails', res, false);
  }

  /** Validate the password */
  const isValidPassword = await dataHelper.validatePassword(password, user.password);
  if (!isValidPassword) {
    return response.badRequest('auth.invalidCredentails', res, false);
  }

  /** Generate the JWT token and insert it into the DB */
  const tokenData = {
    user_id: user._id,
    role: user.role,
  };
  const token = await dataHelper.generateJWTToken(tokenData);

  const userData = {
    tokens: {
      auth_token: token,
      fcm_token: req.headers['fcm-token'],
    },
  };
  const hasUpdated = await UserModel.updateOne(user._id, userData);
  if (!hasUpdated) {
    return response.exception('error.serverError', res, null);
  }

  const formatedUserData = await UserModel.getFormattedData(user);

  const result = {
    token,
    user: formatedUserData,
  };
  return response.success('auth.loggedIn', res, result);
};

const changePassword = async (req, res) => {
  const { new_password } = req.body;
  const { user } = req;

  /* Convert password string into a hash  */
  const hashedPassword = await dataHelper.hashPassword(new_password);

  /** Update new password in DB */
  const userDataToUpdate = {
    password: hashedPassword,
  };
  const hasUpdated = await UserModel.updateOne(user._id, userDataToUpdate);
  if (!hasUpdated) {
    return response.exception('error.serverError', res, null);
  }

  return response.success('auth.passwordChanged', res, true);
};

const forgotPassword = async (req, res) => {
  console.log('UsersController@forgotPassword');

  const { email } = req.body;

  /** Find the user br given email */
  const user = await UserModel.getOneByColumnNameAndValue('email', email);
  if (!user) {
    return response.badRequest('error.invalidEmail', res, false);
  }

  /* Generate OTP to verify the user email  */
  const forgotPasswordVerificationOtp = await dataHelper.generateSecureOTP(6);

  const userDataToUpdate = {
    otp: {
      ...user.otp,
      forgot_password: forgotPasswordVerificationOtp,
    },
  };
  const hasUpdated = await UserModel.updateOne(user._id, userDataToUpdate);
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

const verifyForgotPasswordOTP = async (req, res) => {
  console.log('UsersController@verifyForgotPasswordOTP');

  const { email, otp } = req.body;

  /** Find the user br given email */
  const user = await UserModel.getOneByColumnNameAndValue('email', email);
  if (!user) {
    return response.badRequest('error.invalidEmail', res, false);
  }

  if (!user?.otp?.forgot_password || user.otp.forgot_password !== String(otp)) {
    return response.badRequest('error.invalidOtp', res, false);
  }

  const userDataToUpdate = {
    otp: {
      ...user.otp,
      email_verification: null,
      forgot_password: null,
    },
    is_email_verified: true,
  };

  const hasUpdated = await UserModel.updateOne(user._id, userDataToUpdate);
  if (!hasUpdated) {
    return response.exception('error.serverError', res, null);
  }

  const result = {
    user: {
      id: user._id,
    },
  };

  return response.success('auth.otpVerified', res, result);
};

const resetPassword = async (req, res) => {
  console.log('UsersController@resetPassword');

  const { password, user_id } = req.body;

  const user = await UserModel.getOneByColumnNameAndValue('_id', user_id);
  if (!user) {
    return response.badRequest('error.userNotExist', res, false);
  }

  if (user?.otp?.forgot_password) {
    return response.badRequest('error.otpNotVerified', res, false);
  }

  /* Convert password string into a hash  */
  const hashedPassword = await dataHelper.hashPassword(password);

  /** Update new password in DB */
  const userDataToUpdate = {
    password: hashedPassword,
  };

  const hasUpdated = await UserModel.updateOne(user._id, userDataToUpdate);
  if (!hasUpdated) {
    return response.exception('error.serverError', res, null);
  }

  return response.success('auth.passwordChanged', res, true);
};

const getUserProfile = async (req, res) => {
  console.log('UsersController@getUserProfile');

  const { user } = req;

  socketService.emitToUsers([user._id], socketEvents.EMIT.USER_PROFILE_VIEWED, {
    message: 'Profile viewed',
    time: new Date(),
  });

  const formatedUserData = await UserModel.getFormattedData(user);

  return response.success('success.userProfile', res, formatedUserData);
};

const getAllWithPagination = async (req, res) => {
  console.log('UsersController@getAllWithPagination');

  /** Extract the page and limt from query param */
  const { page, limit } = await dataHelper.getPageAndLimit(req.query);

  const filterObj = {
    role: UserModel.roles.USER,
  };
  const result = await UserModel.getAllWithPagination(page, limit, filterObj);
  if (!result?.data?.length) {
    return response.success('success.noRecordsFound', res, result);
  }

  return response.success('success.usersData', res, result);
};

const logout = async (req, res) => {
  console.log('UsersController@logout');

  const { user } = req;

  const dataToUpdate = {
    'tokens.auth_token': '',
    'tokens.fcm_token': '',
  };

  const hasUpdated = await UserModel.updateOne(user._id, dataToUpdate);
  if (!hasUpdated) {
    return response.exception('error.serverError', res, null);
  }

  return response.success('auth.logoutSuccess', res, true);
};

const deleteOne = async (req, res) => {
  console.log('UsersController@logout');

  const { user } = req;

  // convert date into format example -2025-07-03T09:48:05.031+00:00
  const dataToUpdate = {
    deleted_at: new Date().toISOString().replace('Z', '+00:00'),
  };

  const hasDeleted = await UserModel.updateOne(user._id, dataToUpdate);
  if (!hasDeleted) {
    return response.exception('error.serverError', res, null);
  }

  return response.success('auth.deleteAccount', res, true);
};

const uploadImage = async (req, res) => {
  console.log('UsersController@uploadImage');

  if (!req?.file?.path) {
    return response.badRequest('error.fileNotUploaded', res, false);
  }

  /** Convert file path into a public URL */
  const filePath = req.file.path.replace(/\\/g, '/');
  const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;

  return response.success('success.fileUploaded', res, { image_url: fileUrl });
};

const uploadBulkImages = async (req, res) => {
  console.log('UsersController@uploadBulkImages');

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

const deleteImage = async (req, res) => {
  console.log('UsersController@deleteImage');

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

const uploadImageAWS = async (req, res) => {
  console.log('UsersController@uploadImageAWS');

  return response.success('success.fileUploaded', res, { image_url: req.image_url });
};

const deleteImageAWS = async (req, res) => {
  console.log('UsersController@deleteImage');

  const { image_url } = req.body;

  const hasDeleted = await aws.deleteFile(image_url);
  if (!hasDeleted) {
    return response.badRequest('error.fileNotFound', res, false);
  }

  return response.success('success.fileDeleted', res, true);
};

const generatePresignedUrl = async (req, res) => {
  console.log('UsersController@generatePresignedUrl');

  const { file_name, file_type, folder = 'uploads' } = req.body;

  try {
    const result = await aws.getPresignedUrl(folder, file_name, file_type);
    if (!result) {
      return response.badRequest('error.serverError', res, false);
    }

    return response.success('success.presignedUrlGenerated', res, result);
  } catch (error) {
    return response.exception('error.serverError', res, null);
  }
};

module.exports = {
  createOne,
  resendOtp,
  userLogin,
  getUserProfile,
  changePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  verifyOtp,
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
