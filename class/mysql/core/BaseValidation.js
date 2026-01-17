const response = require('../helpers/v1/response.helpers');
const dataHelper = require('../helpers/v1/data.helpers');

/**
 * BaseValidation - Abstract Base Class for all Validations
 *
 * This class provides common validation functionality:
 * - Encapsulation: Protected methods for validation logic
 * - Single Responsibility: Handles only validation
 * - DRY Principle: Reusable validation methods
 *
 * @abstract
 */
class BaseValidation {
  constructor(validationName = 'BaseValidation') {
    if (new.target === BaseValidation) {
      throw new TypeError('Cannot construct BaseValidation instances directly');
    }

    this.validationName = validationName;
    this.response = response;
    this.dataHelper = dataHelper;
  }

  /**
     * Log validation action
     * @protected
     */
  _log(action) {
    console.log(`${this.validationName}@${action}`);
  }

  /**
     * Validate request body against Joi schema
     * @protected
     * @param {Object} data - Data to validate
     * @param {Object} schema - Joi schema object
     * @param {Object} res - Express response object
     * @returns {Promise<boolean>} - Returns true if valid, sends error response if invalid
     */
  async _validateSchema(data, schema, res) {
    const errors = await this.dataHelper.joiValidation(data, schema);
    if (errors?.length) {
      this.response.validationError(errors[0], res, errors);
      return false;
    }
    return true;
  }

  /**
     * Validate password strength
     * @protected
     * @param {string} password - Password to validate
     * @param {Object} res - Express response object
     * @returns {Promise<boolean>} - Returns true if valid, sends error response if invalid
     */
  async _validatePasswordStrength(password, res) {
    const passwordCheck = await this.dataHelper.checkPasswordRegex(password);
    if (!passwordCheck) {
      this.response.validationError('validation.strongPassword', res, false);
      return false;
    }
    return true;
  }

  /**
     * Validate password confirmation match
     * @protected
     * @param {string} password - Password
     * @param {string} confirmPassword - Confirmation password
     * @param {Object} res - Express response object
     * @returns {boolean} - Returns true if match, sends error response if not
     */
  _validatePasswordMatch(password, confirmPassword, res) {
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password !== confirmPassword) {
      this.response.validationError('validation.confirmPasswordNotMatch', res, false);
      return false;
    }
    return true;
  }

  /**
     * Validate that new password is different from old password
     * @protected
     * @param {string} newPassword - New password
     * @param {string} oldPassword - Old password
     * @param {Object} res - Express response object
     * @returns {boolean} - Returns true if different, sends error response if same
     */
  _validatePasswordDifferent(newPassword, oldPassword, res) {
    if (newPassword === oldPassword) {
      this.response.validationError('validation.newAndOldPasswordSame', res, false);
      return false;
    }
    return true;
  }

  /**
     * Validate old password against stored hash
     * @protected
     * @param {string} oldPassword - Old password to validate
     * @param {string} storedHash - Stored password hash
     * @param {Object} res - Express response object
     * @returns {Promise<boolean>} - Returns true if valid, sends error response if invalid
     */
  async _validateOldPassword(oldPassword, storedHash, res) {
    const isValid = await this.dataHelper.validatePassword(oldPassword, storedHash);
    if (!isValid) {
      this.response.badRequest('validation.invalidOldPassword', res, false);
      return false;
    }
    return true;
  }

  /**
     * Execute validation middleware
     * Template method that child classes can use
     * @protected
     * @param {string} methodName - Name of validation method
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next function
     * @param {Function} validationFn - Validation function to execute
     */
  async _executeValidation(methodName, req, res, next, validationFn) {
    this._log(methodName);

    try {
      const isValid = await validationFn(req, res);
      if (isValid) {
        next();
      }
      // If not valid, error response already sent by validation function
    } catch (error) {
      console.error(`${this.validationName}@${methodName} Error:`, error);
      this.response.exception('error.serverError', res, false);
    }
  }
}

module.exports = BaseValidation;
