const jwt = require('jsonwebtoken');

/** Custom Require * */
const response = require('../../helpers/v1/response.helpers');
const UserResources = require('../../resources/v1/users/users.resources');

// Wrap jwt.verify into a Promise for better async/await support
const verifyToken = (token) => new Promise((resolve, reject) => {
  jwt.verify(token, process.env.JWT_TOKEN_KEY, (err, decoded) => {
    if (err) {
      return reject(err); // Reject with the error if verification fails
    }
    resolve(decoded); // Resolve with decoded payload if token is valid
  });
});

const auth = (roleToValidate = null) => async (req, res, next) => {
  console.log('AuthorizationMiddleware@auth');

  let token = req.headers.authorization;

  if (!token) {
    return response.unauthorized('auth.unauthorizedRequest', res, false);
  }

  if (token.startsWith('Bearer ')) {
    [, token] = token.split(' ');
  }

  try {
    // Verify the token
    const decoded = await verifyToken(token);

    // Find user by decoded user_id
    const user = await UserResources.getOneByColumnNameAndValue('id', decoded.user_id);
    if (!user) {
      return response.unauthorized('error.userNotFound', res, false);
    }

    // Check if the token matches the stored auth_token for the user
    if (!user?.auth_token || user.auth_token !== token) {
      return response.unauthorized('auth.tokenMismatch', res, false);
    }

    // Role validation
    if (roleToValidate) {
      if (
        ![UserResources.roles.ADMIN, UserResources.roles.USER].includes(roleToValidate)
        || user.role !== roleToValidate
      ) {
        return response.badRequest('auth.unauthorizedRole', res, false);
      }
    }

    // Check if the user is active
    if (user.status !== UserResources.statuses.ACTIVE) {
      const errorMessage = res.__('auth.accountBlocked', { supportEmail: process.env.SUPPORT_MAIL });
      return response.unauthorized(errorMessage, res, false);
    }

    // Attach the user to the request
    req.user = user;

    // Proceed to next middleware
    next();
  } catch (error) {
    return response.unauthorized(error.message, res, false);
  }
};

module.exports = {
  auth,
};
