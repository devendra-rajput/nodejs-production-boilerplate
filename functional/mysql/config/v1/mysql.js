const Sequelize = require('sequelize');

/** Establish the connection with DB */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: process.env.DB_DRIVER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    logging: false,
  },
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to mysql');
  } catch (err) {
    console.log('error connecting to mysql: ', err.message);
    console.log('Retrying MySQL connection in 5 seconds...');
    await new Promise((resolve) => { setTimeout(resolve, 5000); });
    return connectDB();
  }
};

module.exports = {
  sequelize,
  connectDB,
};
