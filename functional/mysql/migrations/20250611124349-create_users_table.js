/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone_code: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      profile_picture: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      auth_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      fcm_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      email_verification_otp: {
        type: Sequelize.STRING(6),
        allowNull: true,
        defaultValue: null,
      },
      forgot_password_otp: {
        type: Sequelize.STRING(6),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.ENUM('0', '1', '2', '3'), // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
        allowNull: false,
        defaultValue: '1',
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'), // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
        allowNull: false,
        defaultValue: 'user',
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN, // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    return queryInterface.dropTable('users');
  },
};
