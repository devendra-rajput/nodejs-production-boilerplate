/**
 * MongoDB Configuration
 * Handles Mongoose connection and events
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection;

    db.on('error', console.error.bind(console, 'Database Connection Error: '));
    // mongoose.set('debug', true);

    db.once('open', () => {
      console.log('Database Connected Successfully!');
    });

    return db;
  } catch (err) {
    console.error(`MongoDB Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
};
