/** Custom Require * */
const dataHelper = require('../helpers/v1/data.helpers');

module.exports = {
  /**
   * Run the database seed
   */
  async up(queryInterface) {
    const hashedPassword = await dataHelper.hashPassword('Admin@123');
    const users = [{
      first_name: 'Super',
      last_name: 'Admin',
      email: 'admin@yopmail.com',
      password: hashedPassword,
      phone_code: '+1',
      phone_number: '1234567890',
      role: 'admin',
      status: '1',
      is_email_verified: true,
    }];

    await queryInterface.bulkInsert('users', users, {});
  },

  /**
   * Revert the database seed
   */
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  },
};
