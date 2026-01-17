const nodemailer = require('nodemailer');
const path = require('path');
const { BaseService } = require('../core');
const { logger } = require('../utils/logger');

/**
 * NodemailerService - Extends BaseService
 *
 * Handles email sending operations
 * Demonstrates:
 * - Inheritance: Extends BaseService
 * - Encapsulation: Uses protected methods from base class
 * - Error Handling: Uses _executeWithErrorHandling
 */
class NodemailerService extends BaseService {
  constructor() {
    super('NodemailerService');
    this.transporter = null;
  }

  /**
   * Initialize email transporter
   * @override
   */
  async initialize() {
    return this._executeWithErrorHandling('initialize', async () => {
      this.transporter = await nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
      });

      this._setInitialized(true);
      console.log(`${this.serviceName}: Transporter initialized`);
      return true;
    })
  }

  /**
   * Get or create transporter
   * @private
   */
  async _getTransporter() {
    if (!this.transporter) {
      await this.initialize();
    }
    return this.transporter;
  }

  /**
   * Prepare email parameters
   * @private
   */
  _prepareEmailParams(to, subject, html, attachments = []) {
    const params = {
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      attachments: [
        {
          filename: 'brand_logo.png',
          path: path.join(__dirname, '../public/img/brand_logo.png'),
          cid: 'brand_logo',
        },
      ],
    };

    if (attachments?.length) {
      params.attachments = [...params.attachments, ...attachments];
    }

    return params;
  }

  /**
   * Send email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {Array} attachments - Optional attachments
   * @returns {Promise<string|boolean>} Message ID or false
   */
  async sendMail(to, subject, html, attachments = []) {
    return this._executeWithErrorHandling('sendMail', async () => {
      // Validate required parameters
      this._validateParams({ to, subject, html }, ['to', 'subject', 'html']);

      // Get transporter
      const transporter = await this._getTransporter();

      // Prepare email parameters
      const params = this._prepareEmailParams(to, subject, html, attachments);

      // Send email
      const info = await transporter.sendMail(params);
      console.log(`${this.serviceName}: Email sent - Message ID: ${info.messageId}`);

      return info.messageId;
    }).catch((error) => {
      // Log error with logger
      logger.error('Email sending failed', {
        error: error.message,
        to,
        subject,
        action: 'send_email',
      });
      return false;
    });
  }

  /**
   * Cleanup transporter
   * @override
   */
  async cleanup() {
    return this._executeWithErrorHandling('cleanup', async () => {
      if (this.transporter) {
        this.transporter.close();
        this.transporter = null;
      }
      this._setInitialized(false);
      console.log(`${this.serviceName}: Cleanup completed`);
      return true;
    });
  }
}

module.exports = new NodemailerService();
