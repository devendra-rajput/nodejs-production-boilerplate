const Joi = require('joi');
const { BaseValidation } = require('../../../core');

/**
 * UserValidation - Extends BaseValidation
 *
 * Handles user-related validation logic
 * Demonstrates:
 * - Inheritance: Extends BaseValidation
 * - Code Reuse: Uses base validation methods
 * - Clean Code: Eliminates duplication
 */
class UserValidation extends BaseValidation {
  constructor() {
    super('UserValidation');
  }

  /**
   * Validate create user request
   */
  createOne = async (req, res, next) => {
    await this._executeValidation('createOne', req, res, next, async () => {
      const schema = {
        first_name: Joi.string().required(),
        last_name: Joi.string().optional(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        confirm_password: Joi.string().required(),
        phone_number: Joi.number().optional(),
        phone_code: Joi.string().when('phone_number', {
          is: Joi.exist(),
          then: Joi.required(),
          otherwise: Joi.optional(),
        }),
      };

      // Validate schema
      if (!await this._validateSchema(req.body, schema, res)) return false;

      // Validate password strength
      if (!await this._validatePasswordStrength(req.body.password, res)) return false;

      // Validate password match
      if (!this._validatePasswordMatch(
        req.body.password,
        req.body.confirm_password,
        res,
      )) return false;

      return true;
    });
  };

  /**
   * Validate resend OTP request
   */
  resendOtp = async (req, res, next) => {
    await this._executeValidation('resendOtp', req, res, next, async () => {
      const schema = {
        email: Joi.string().email().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate OTP verification request
   */
  verifyOtp = async (req, res, next) => {
    await this._executeValidation('verifyOtp', req, res, next, async () => {
      const schema = {
        email: Joi.string().email().required(),
        otp: Joi.number().integer().strict().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate user login request
   */
  userLogin = async (req, res, next) => {
    await this._executeValidation('userLogin', req, res, next, async () => {
      const schema = {
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate change password request
   */
  changePassword = async (req, res, next) => {
    await this._executeValidation('changePassword', req, res, next, async () => {
      const schema = {
        old_password: Joi.string().required(),
        new_password: Joi.string().required(),
        confirm_new_password: Joi.string().required(),
      };

      // Validate schema
      if (!await this._validateSchema(req.body, schema, res)) return false;

      // Validate new password strength
      if (!await this._validatePasswordStrength(req.body.new_password, res)) return false;

      // Validate new password match
      if (!this._validatePasswordMatch(
        req.body.new_password,
        req.body.confirm_new_password,
        res,
      )) return false;

      // Validate new password is different from old
      if (!this._validatePasswordDifferent(
        req.body.new_password,
        req.body.old_password,
        res,
      )) return false;

      // Validate old password
      if (!await this._validateOldPassword(
        req.body.old_password,
        req.user.password,
        res,
      )) return false;

      return true;
    });
  };

  /**
   * Validate forgot password request
   */
  forgotPassword = async (req, res, next) => {
    await this._executeValidation('forgotPassword', req, res, next, async () => {
      const schema = {
        email: Joi.string().email().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate forgot password OTP verification request
   */
  verifyForgotPasswordOTP = async (req, res, next) => {
    await this._executeValidation('verifyForgotPasswordOTP', req, res, next, async () => {
      const schema = {
        email: Joi.string().email().required(),
        otp: Joi.number().integer().strict().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate reset password request
   */
  resetPassword = async (req, res, next) => {
    await this._executeValidation('resetPassword', req, res, next, async () => {
      const schema = {
        password: Joi.string().required(),
        confirm_password: Joi.string().required(),
        user_id: Joi.string().required(),
      };

      // Validate schema
      if (!await this._validateSchema(req.body, schema, res)) return false;

      // Validate password strength
      if (!await this._validatePasswordStrength(req.body.password, res)) return false;

      // Validate password match
      if (!this._validatePasswordMatch(
        req.body.password,
        req.body.confirm_password,
        res,
      )) return false;

      return true;
    });
  };

  /**
   * Validate delete image request
   */
  deleteImage = async (req, res, next) => {
    await this._executeValidation('deleteImage', req, res, next, async () => {
      const schema = {
        image_url: Joi.string().uri().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate delete AWS image request
   */
  deleteImageAWS = async (req, res, next) => {
    await this._executeValidation('deleteImageAWS', req, res, next, async () => {
      const schema = {
        image_url: Joi.string().uri().required(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };

  /**
   * Validate generate presigned URL request
   */
  generatePresignedUrl = async (req, res, next) => {
    await this._executeValidation('generatePresignedUrl', req, res, next, async () => {
      const schema = {
        file_name: Joi.string().required(),
        file_type: Joi.string().required(),
        folder: Joi.string().optional(),
      };

      return this._validateSchema(req.body, schema, res);
    });
  };
}

module.exports = new UserValidation();