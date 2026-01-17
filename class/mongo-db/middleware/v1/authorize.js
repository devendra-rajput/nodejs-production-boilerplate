const jwt = require('jsonwebtoken');
const response = require('../../helpers/v1/response.helpers');
const UserModel = require('../../resources/v1/users/users.model');

/**
 * AuthMiddleware - JWT Authentication and Authorization
 *
 * Handles:
 * - JWT token verification
 * - User authentication
 * - Role-based authorization
 * - User status validation
 */
class AuthMiddleware {
  constructor() {
    this.response = response;
    this.userModel = UserModel;
  }

  /**
   * Verify JWT token
   * @private
   */
  _verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  }

  /**
   * Extract token from request headers
   * @private
   */
  _extractToken(req) {
    let token = req.headers.authorization;

    if (!token) {
      return null;
    }

    if (token.startsWith('Bearer ')) {
      [, token] = token.split(' ');
    }

    return token;
  }

  /**
   * Validate user role
   * @private
   */
  _validateRole(user, roleToValidate) {
    if (!roleToValidate) {
      return true;
    }

    const validRoles = [this.userModel.roles.ADMIN, this.userModel.roles.USER];

    if (!validRoles.includes(roleToValidate) || user.role !== roleToValidate) {
      return false;
    }

    return true;
  }

  /**
   * Check if user account is active
   * @private
   */
  _isUserActive(user) {
    return user.status === this.userModel.statuses.ACTIVE;
  }

  /**
   * Authentication middleware
   * @param {string|null} roleToValidate - Optional role to validate
   * @returns {Function} Express middleware function
   */
  auth(roleToValidate = null) {
    return async (req, res, next) => {
      console.log('AuthMiddleware@auth');

      // Extract token
      const token = this._extractToken(req);
      if (!token) {
        return this.response.unauthorized('auth.unauthorizedRequest', res, false);
      }

      try {
        // Verify token
        const decoded = await this._verifyToken(token);

        // Find user
        const user = await this.userModel.getOneByColumnNameAndValue('_id', decoded.user_id);
        if (!user) {
          return this.response.unauthorized('error.userNotFound', res, false);
        }

        // Check token match
        if (!user?.tokens?.auth_token || user.tokens.auth_token !== token) {
          return this.response.unauthorized('auth.tokenMismatch', res, false);
        }

        // Validate role
        if (!this._validateRole(user, roleToValidate)) {
          return this.response.badRequest('auth.unauthorizedRole', res, false);
        }

        // Check if user is active
        if (!this._isUserActive(user)) {
          const errorMessage = res.__('auth.accountBlocked', {
            supportEmail: process.env.SUPPORT_MAIL,
          });
          return this.response.unauthorized(errorMessage, res, false);
        }

        // Attach user to request
        req.user = user;

        // Proceed to next middleware
        next();
      } catch (error) {
        console.error('AuthMiddleware@auth Error:', error.message);
        return this.response.unauthorized(error.message, res, false);
      }
    };
  }
}

module.exports = new AuthMiddleware();
