const Joi = require('joi');

/** Custom Require * */

const response = require('../../../helpers/v1/response.helpers');
const dataHelper = require('../../../helpers/v1/data.helpers');

/** Validate the create user data * */
const createOne = async (req, res, next) => {
  console.log('UsersValidation@createOne');

  const schema = {
    first_name: Joi.string().required(),
    last_name: Joi.string().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    confirm_password: Joi.string().required(),
    phone_number: Joi.number().optional(),
    phone_code: Joi.string()
      .when('phone_number', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  const passwordCheck = await dataHelper.checkPasswordRegex(req.body.password);
  if (!passwordCheck) {
    return response.validationError('validation.strongPassword', res, false);
  }

  if (req.body.password !== req.body.confirm_password) {
    return response.validationError('validation.confirmPasswordNotMatch', res, false);
  }

  next();
};

/** Validate the resend-otp request * */
const resendOtp = async (req, res, next) => {
  console.log('UsersValidation@resendOtp');

  const schema = {
    email: Joi.string().email().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the otp verification request * */
const verifyOtp = async (req, res, next) => {
  console.log('UsersValidation@verifyOtp');

  const schema = {
    email: Joi.string().email().required(),
    otp: Joi.number().integer().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the user login data * */
const userLogin = async (req, res, next) => {
  console.log('UsersValidation@userLogin');

  const schema = {
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the change password request * */
const changePassword = async (req, res, next) => {
  console.log('UsersValidation@changePassword');

  const schema = {
    old_password: Joi.string().required(),
    new_password: Joi.string().required(),
    confirm_new_password: Joi.string().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  const passwordCheck = await dataHelper.checkPasswordRegex(req.body.new_password);
  if (!passwordCheck) {
    return response.validationError('validation.strongPassword', res, false);
  }

  if (req.body.new_password !== req.body.confirm_new_password) {
    return response.validationError('validation.confirmPasswordNotMatch', res, false);
  }

  if (req.body.new_password === req.body.old_password) {
    return response.validationError('validation.newAndOldPasswordSame', res, false);
  }

  /** Validate the old password */
  const isOldPasswordValid = await dataHelper.validatePassword(
    req.body.old_password,
    req.user.password,
  );
  if (!isOldPasswordValid) {
    return response.badRequest('validation.invalidOldPassword', res, false);
  }

  next();
};

/** Validate the forgot password request * */
const forgotPassword = async (req, res, next) => {
  console.log('UsersValidation@forgotPassword');

  const schema = {
    email: Joi.string().email().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the forgot password OTP verification request * */
const verifyForgotPasswordOTP = async (req, res, next) => {
  console.log('UsersValidation@verifyForgotPasswordOTP');

  const schema = {
    email: Joi.string().email().required(),
    otp: Joi.number().integer().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the reset password request * */
const resetPassword = async (req, res, next) => {
  console.log('UsersValidation@resetPassword');

  const schema = {
    password: Joi.string().required(),
    confirm_password: Joi.string().required(),
    user_id: Joi.string().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  const passwordCheck = await dataHelper.checkPasswordRegex(req.body.password);
  if (!passwordCheck) {
    return response.validationError('validation.strongPassword', res, false);
  }

  if (req.body.password !== req.body.confirm_password) {
    return response.validationError('validation.confirmPasswordNotMatch', res, false);
  }

  next();
};

/** Validate the delete image data * */
const deleteImage = async (req, res, next) => {
  console.log('UsersValidation@deleteImage');

  const schema = {
    image_url: Joi.string().uri().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the delete image data * */
const deleteImageAWS = async (req, res, next) => {
  console.log('UsersValidation@deleteImageAWS');

  const schema = {
    image_url: Joi.string().uri().required(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

/** Validate the presigned url generation data * */
const generatePresignedUrl = async (req, res, next) => {
  console.log('UsersValidation@generatePresignedUrl');

  const schema = {
    file_name: Joi.string().required(),
    file_type: Joi.string().required(),
    folder: Joi.string().optional(),
  };

  const errors = await dataHelper.joiValidation(req.body, schema);
  if (errors?.length) {
    return response.validationError(errors[0], res, errors);
  }

  next();
};

module.exports = {
  createOne,
  userLogin,
  changePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  resendOtp,
  verifyOtp,
  deleteImage,
  deleteImageAWS,
  generatePresignedUrl,
};
