/**
 * EnvValidator - Environment Variable Validation Utility
 *
 * Validates required environment variables on startup
 * Follows OOP principles:
 * - Encapsulation: Validation logic in one class
 * - Single Responsibility: Only handles env validation
 */
class EnvValidator {
  constructor() {
    this.requiredVars = ['NODE_ENV', 'APPLICATION_PORT', 'DB_DRIVER', 'MAIL_HOST', 'REDIS_URL', 'JWT_TOKEN_KEY'];

    this.validEnvironments = ['development', 'production', 'staging', 'test'];
  }

  /**
   * Check for missing environment variables
   * @private
   * @returns {Array<string>} Missing variable names
   */
  _getMissingVars() {
    return this.requiredVars.filter((varName) => !process.env[varName]);
  }

  /**
   * Validate NODE_ENV value
   * @private
   * @returns {boolean}
   */
  _isValidNodeEnv() {
    return this.validEnvironments.includes(process.env.NODE_ENV);
  }

  /**
   * Validate required environment variables
   * @throws {Error} If validation fails
   */
  validateRequired() {
    const missingVars = this._getMissingVars();

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars);
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    console.log('✅ All required environment variables are present');
  }

  /**
   * Validate NODE_ENV value
   * @throws {Error} If validation fails
   */
  validateNodeEnv() {
    if (!this._isValidNodeEnv()) {
      console.error('❌ Invalid NODE_ENV:', process.env.NODE_ENV);
      console.error('   Valid values:', this.validEnvironments.join(', '));
      throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}`);
    }

    console.log(`✅ NODE_ENV is valid: ${process.env.NODE_ENV}`);
  }

  /**
   * Validate all environment variables
   * @param {boolean} exitOnError - Exit process on error (default: true)
   */
  validate(exitOnError = true) {
    try {
      this.validateRequired();
      this.validateNodeEnv();
      console.log('✅ Environment validation passed');
    } catch (error) {
      console.error('❌ Environment validation failed:', error.message);

      if (exitOnError) {
        process.exit(1);
      } else {
        throw error;
      }
    }
  }
}

module.exports = new EnvValidator();
