const BaseSeeder = require('../core/BaseSeeder');
const User = require('../resources/v1/users/user.schema');
const dataHelper = require('../helpers/v1/data.helpers');

/**
 * AdminSeeder - Seeds default admin user
 */
class AdminSeeder extends BaseSeeder {
  constructor() {
    super('AdminSeeder');
  }

  /**
   * Seed the database
   * Clears existing admins and inserts new one
   */
  async seed() {
    const hashedPassword = await dataHelper.hashPassword('Admin@123');
    const users = [{
      email: 'admin@yopmail.com',
      password: hashedPassword,
      user_info: {
        first_name: 'Super',
        last_name: 'Admin',
      },
      phone_code: '+1',
      phone_number: '1234567890',
      tokens: {
        auth_token: '',
        fcm_token: '',
      },
      role: 'admin',
      status: '1',
      is_email_verified: true,
      deleted_at: null,
    }];

    // Clear existing admins
    console.log('Clearing existing admin users...');
    await User.deleteMany({ role: 'admin' });

    // Insert new admin
    console.log('Inserting new admin user...');
    await User.insertMany(users);
  }
}

// Execute if run directly
if (require.main === module) {
  new AdminSeeder().run();
}

module.exports = AdminSeeder;
