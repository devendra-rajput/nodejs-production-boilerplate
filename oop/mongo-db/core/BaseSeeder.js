const mongoose = require('mongoose');
const minimist = require('minimist');
require('dotenv').config();

/**
 * BaseSeeder - Abstract class for database seeders
 * Handles database connection and cleanup
 */
class BaseSeeder {
  constructor(seederName) {
    this.seederName = seederName;
    this.args = minimist(process.argv.slice(2));
    this.environment = this.args.env || process.env.NODE_ENV || 'development';

    // Load env based on argument or default
    // eslint-disable-next-line global-require
    require('dotenv').config({ path: `.env.${this.environment}` });
  }

  /**
    * Initialize database connection
    */
  async connect() {
    try {
      console.log(`${this.seederName}: Connecting to database...`);
      await mongoose.connect(process.env.DATABASE_URL);
      console.log(`${this.seederName}: Database connected`);
    } catch (error) {
      console.error(`${this.seederName}: Connection failed:`, error);
      throw error;
    }
  }

  /**
    * Close database connection
    */
  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log(`${this.seederName}: Database connection closed`);
    } catch (error) {
      console.error(`${this.seederName}: Disconnect failed:`, error);
    }
  }

  /**
    * Run the seeding process
    * Must be implemented by child class
    */
  async seed() {
    throw new Error('seed() method must be implemented by child class');
  }

  /**
    * Execute the seeder
    * Handles the full lifecycle: connect -> seed -> disconnect
    */
  async run() {
    try {
      await this.connect();
      await this.seed();
      console.log(`${this.seederName}: Seeding completed successfully`);

      await this.disconnect();
      process.exit(0);
    } catch (error) {
      console.error(`${this.seederName}: Seeding failed:`, error);
      await this.disconnect();
      process.exit(1);
    }
  }
}

module.exports = BaseSeeder;
