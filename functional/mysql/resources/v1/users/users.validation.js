/**
 * User Validation Middleware
 * Validates user-related requests using Joi schemas
 */

const Joi = require('joi');

const response = require('../../../helpers/v1/response.helpers');
const dataHelper = require('../../../helpers/v1/data.helpers');

/**
 * Reusable Joi Schema Components
 */
const SCHEMAS = Object.freeze({
  email: Joi.string().email().required(),
  emailOptional: Joi.string().email().optional(),
  password: Joi.string().required(),
  otp: Joi.number().integer().required(),
  phoneNumber: Joi.number().optional(),
  phoneCode: Joi.string().when('phone_number', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  firstName: Joi.string().required(),
  lastName: Joi.string().optional(),
  imageUrl: Joi.string().uri().required(),
  fileName: Joi.string().required(),
  fileType: Joi.string().required(),
  folder: Joi.string().optional(),
  userId: Joi.string().required(),
});

/**
 * Validation Schemas
 */
const validationSchemas = Object.freeze({
  createOne: {
    first_name: SCHEMAS.firstName,
    last_name: SCHEMAS.lastName,
    email: SCHEMAS.email,
    password: SCHEMAS.password,
    confirm_password: SCHEMAS.password,
    phone_number: SCHEMAS.phoneNumber,
    phone_code: SCHEMAS.phoneCode,
  },
  resendOtp: {
    email: SCHEMAS.email,
  },
  verifyOtp: {
    email: SCHEMAS.email,
    otp: SCHEMAS.otp,
  },
  userLogin: {
    email: SCHEMAS.email,
    password: SCHEMAS.password,
  },
  changePassword: {
    old_password: SCHEMAS.password,
    new_password: SCHEMAS.password,
    confirm_new_password: SCHEMAS.password,
  },
  forgotPassword: {
    email: SCHEMAS.email,
  },
  verifyForgotPasswordOTP: {
    email: SCHEMAS.email,
    otp: SCHEMAS.otp,
  },
  resetPassword: {
    password: SCHEMAS.password,
    confirm_password: SCHEMAS.password,
    user_id: SCHEMAS.userId,
  },
  deleteImage: {
    image_url: SCHEMAS.imageUrl,
  },
  deleteImageAWS: {
    image_url: SCHEMAS.imageUrl,
  },
  generatePresignedUrl: {
    file_name: SCHEMAS.fileName,
    file_type: SCHEMAS.fileType,
    folder: SCHEMAS.folder,
  },
});

/**
 * Pure Validation Functions
 */

/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => dataHelper.checkPasswordRegex(password);

/**
 * Validate password match
 */
const validatePasswordMatch = (password, confirmPassword) => password === confirmPassword;

/**
 * Validate passwords are different
 */
const validatePasswordsDifferent = (newPassword, oldPassword) => newPassword !== oldPassword;

/**
 * Validate old password
 */
const validateOldPassword = async (oldPassword, storedPassword) => (
  dataHelper.validatePassword(oldPassword, storedPassword)
);

/**
 * Higher-Order Validation Factory
 */

/**
 * Create validation middleware
 * Factory function that creates validation middleware
 */
const createValidator = (schema, customValidation = null) => async (req, res, next) => {
  // Joi schema validation
  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  // Custom validation
  if (customValidation) {
    const customError = await customValidation(req, res);
    if (customError) {
      return customError;
    }
  }

  next();
};

/**
 * Validate create user request
 */
const validateCreateUser = async (req, res) => {
  const { password, confirm_password } = req.body;

  // Check password strength
  const isStrongPassword = await validatePasswordStrength(password);
  if (!isStrongPassword) {
    return response.validationError('validation.strongPassword', res, false);
  }

  // Check password match
  if (!validatePasswordMatch(password, confirm_password)) {
    return response.validationError('validation.confirmPasswordNotMatch', res, false);
  }

  return null;
};

/**
 * Validate change password request
 */
const validateChangePassword = async (req, res) => {
  const { old_password, new_password, confirm_new_password } = req.body;
  const { user } = req;

  // Check new password strength
  const isStrongPassword = await validatePasswordStrength(new_password);
  if (!isStrongPassword) {
    return response.validationError('validation.strongPassword', res, false);
  }

  // Check new password match
  if (!validatePasswordMatch(new_password, confirm_new_password)) {
    return response.validationError('validation.confirmPasswordNotMatch', res, false);
  }

  // Check new password is different from old
  if (!validatePasswordsDifferent(new_password, old_password)) {
    return response.validationError('validation.newAndOldPasswordSame', res, false);
  }

  // Validate old password
  const isOldPasswordValid = await validateOldPassword(old_password, user.password);
  if (!isOldPasswordValid) {
    return response.badRequest('validation.invalidOldPassword', res, false);
  }

  return null;
};

/**
 * Validate reset password request
 */
const validateResetPassword = async (req, res) => {
  const { password, confirm_password } = req.body;

  // Check password strength
  const isStrongPassword = await validatePasswordStrength(password);
  if (!isStrongPassword) {
    return response.validationError('validation.strongPassword', res, false);
  }

  // Check password match
  if (!validatePasswordMatch(password, confirm_password)) {
    return response.validationError('validation.confirmPasswordNotMatch', res, false);
  }

  return null;
};

/**
 * Validation Middleware Exports
 */

const createOne = createValidator(validationSchemas.createOne, validateCreateUser);
const resendOtp = createValidator(validationSchemas.resendOtp);
const verifyOtp = createValidator(validationSchemas.verifyOtp);
const userLogin = createValidator(validationSchemas.userLogin);
const changePassword = createValidator(
  validationSchemas.changePassword,
  validateChangePassword,
);
const forgotPassword = createValidator(validationSchemas.forgotPassword);
const verifyForgotPasswordOTP = createValidator(validationSchemas.verifyForgotPasswordOTP);
const resetPassword = createValidator(validationSchemas.resetPassword, validateResetPassword);
const deleteImage = createValidator(validationSchemas.deleteImage);
const deleteImageAWS = createValidator(validationSchemas.deleteImageAWS);
const generatePresignedUrl = createValidator(validationSchemas.generatePresignedUrl);

/**
 * Export all validation middleware
 */
module.exports = {
  createOne,
  resendOtp,
  verifyOtp,
  userLogin,
  changePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  deleteImage,
  deleteImageAWS,
  generatePresignedUrl,
};
