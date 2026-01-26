const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';
dotenv.config({
  path: `.env.${env}`,
});

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DRIVER,
    logging: false,
    dialectOptions: {
      decimalNumbers: true,
    },
  },
  staging: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DRIVER,
    logging: false,
    dialectOptions: {
      decimalNumbers: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DRIVER,
    logging: false,
    dialectOptions: {
      decimalNumbers: true,
    },
  },
};
