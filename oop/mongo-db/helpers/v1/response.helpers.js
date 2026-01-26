const i18n = require('../../config/i18n');

/**
 * ResponseHelper - HTTP Response Utility Class
 * Provides standardized HTTP response methods
 */
class ResponseHelper {
  /**
   * Send success response (200)
   */
  success(msg, res, data) {
    return this.sendResponse(200, msg, res, data);
  }

  /**
   * Send created response (201)
   */
  created(msg, res, data) {
    return this.sendResponse(201, msg, res, data);
  }

  /**
   * Send no content response (204)
   */
  noContent(msg, res, data) {
    return this.sendResponse(204, msg, res, data);
  }

  /**
   * Send bad request response (400)
   */
  badRequest(msg, res, data) {
    return this.sendResponse(400, msg, res, data);
  }

  /**
   * Send unauthorized response (401)
   */
  unauthorized(msg, res, data) {
    return this.sendResponse(401, msg, res, data);
  }

  /**
   * Send forbidden response (403)
   */
  forbidden(msg, res, data) {
    return this.sendResponse(403, msg, res, data);
  }

  /**
   * Send not found response (404)
   */
  notFound(msg, res, data) {
    return this.sendResponse(404, msg, res, data);
  }

  /**
   * Send method not allowed response (405)
   */
  disallowed(msg, res, data) {
    return this.sendResponse(405, msg, res, data);
  }

  /**
   * Send conflict response (409)
   */
  conflict(msg, res, data) {
    return this.sendResponse(409, msg, res, data);
  }

  /**
   * Send validation error response (422)
   */
  validationError(msg, res, data) {
    return this.sendResponse(422, msg, res, data);
  }

  /**
   * Send server error response (500)
   */
  exception(msg, res, data) {
    return this.sendResponse(500, msg, res, data);
  }

  /**
   * Send custom status code response
   */
  custom(code, msg, res, data) {
    return this.sendResponse(code, msg, res, data);
  }

  /**
   * Send redirect response (302)
   */
  redirect(url, res) {
    return res.status(302).send({
      api_ver: process.env.API_VER,
      redirect_to: url,
    });
  }

  /**
   * Send two-factor authentication enabled response
   */
  twoFactorEnabled(res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).send({
      api_ver: process.env.API_VER,
      msg: 'TwoFactor authentication has been enabled for your account. We have sent you an access code to the phone associated to your account. Please verify the code to proceed',
      two_factor: true,
    });
  }

  /**
  * Send standardized response
  */
  sendResponse(code, msg, res, data) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');

    // Build response body
    const responseBody = {
      statusCode: code,
      api_ver: process.env.API_VER || 'v1',
      message: i18n.__(msg),
    };

    if (data !== undefined && data !== null) {
      responseBody.data = data;
    }

    return res.status(code).send(responseBody);
  }
}

// Export singleton instance
module.exports = new ResponseHelper();
