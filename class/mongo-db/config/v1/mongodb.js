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
    console.log('error connecting to MongoDB: ', err.message);
    console.log('Retrying MongoDB connection in 5 seconds...');
    await new Promise((resolve) => { setTimeout(resolve, 5000); });
    return connectDB();
  }
};

module.exports = {
  connectDB,
};
