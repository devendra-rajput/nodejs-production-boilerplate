const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment-timezone');

/* Valiate the request body as per the provided schema */
const joiValidation = async (reqBody, schema) => {
  console.log('DataHelper@joiValidation');

  try {
    await Joi.object(schema).validateAsync(reqBody);
    return false;
  } catch (error) {
    if (error.details) {
      return error.details.map((e) => e.message.replace(/"/g, ''));
    }

    return false;
  }
};

/* Check the password strength */
const checkPasswordRegex = async (password) => {
  console.log('DataHelper@passwordRegex');

  const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*[@$!%*?&]).{8,}/;
  if (!passwordRegex.test(password)) {
    return false;
  }
  return true;
};

/* Convert password string into hash */
const hashPassword = async (password) => {
  console.log('DataHelper@hashPassword');

  const hashedPassword = await bcrypt.hash(password, 10);
  if (!hashedPassword) {
    throw new Error('Error generating password hash');
  }

  return hashedPassword;
};

/* Validate the hashed password and the password string */
const validatePassword = async (passwordString, passwordHash) => {
  console.log('DataHelper@validatePassword');

  const isPasswordValid = await bcrypt.compare(passwordString, passwordHash);
  if (!isPasswordValid) {
    return false;
  }

  return true;
};

/* Generate the JWT token */
const generateJWTToken = async (data) => {
  console.log('DataHelper@generateJWTToken');

  const token = jwt.sign(data, process.env.JWT_TOKEN_KEY);
  if (!token) {
    return false;
  }

  return token;
};

/* Generate OTP */
const generateSecureOTP = async (length = 6) => {
  console.log('DataHelper@generateSecureOTP');

  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
};

/** Validate the email */
const isValidEmail = async (value) => {
  // Regular expression for validating an email address
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailRegex.test(value)) {
    return true;
  }
  return false;
};

/** Extract the page and limit from query params */
const getPageAndLimit = async (reqQuery) => {
  console.log('DataHelper@getPageAndLimit');

  const resObj = {
    page: 1,
    limit: 50,
  };

  if (reqQuery.page) {
    let pageNo = parseInt(reqQuery.page, 10);

    if (typeof (pageNo) !== 'number') {
      pageNo = 1;
    } else if (pageNo < 1) {
      pageNo = 1;
    }

    resObj.page = pageNo;
  }

  if (reqQuery.limit) {
    let limit = parseInt(reqQuery.limit, 10);

    if (typeof (limit) !== 'number') {
      limit = 50;
    } else if (limit < 1) {
      limit = 50;
    }

    if (limit > 100) {
      limit = 100;
    }

    resObj.limit = limit;
  }

  return resObj;
};

/** Calculate the pagination param and return the offest */
const calculatePagination = async (totalItems = null, currentPage = null, limit = null) => {
  console.log('DataHelper@calculatePagination');

  let page = currentPage;
  let limitVal = limit;

  // set a default currentPage if it's not provided
  if (!page) {
    page = 1;
  }

  // set a default limit if it's not provided
  if (!limitVal) {
    if (totalItems > 50) {
      limitVal = 50;
    } else {
      limitVal = totalItems;
    }
  }

  let totalPages = Math.ceil(totalItems / limitVal);
  if (totalPages < 1) {
    totalPages = 1;
  }

  // if the page number requested is greater than the total pages, set page number to total pages
  if (page > totalPages) {
    page = totalPages;
  }

  let offset;
  if (page > 1) {
    offset = (page - 1) * limitVal;
  } else {
    offset = 0;
  }

  return {
    currentPage: page,
    totalPages,
    offset,
    limit: limitVal,
  };
};

/** Validate the mongo DB id */
const isValidMongoDBId = async (id) => {
  console.log('DataHelper@isValidMongoDBId');

  if (!id || id === '') {
    return false;
  }
  return id.match(/^[0-9a-fA-F]{24}$/);
};

/** Convert into a specific timezone */
const convertDateTimezoneAndFormat = (date, timezone = 'UTC', format = 'YYYY-MM-DDTHH:mm:ssZ') => {
  console.log('DataHelper@convertDateTimezoneAndFormat');

  if (!date) return null;

  return moment(date).tz(timezone).format(format);
};

module.exports = {
  joiValidation,
  checkPasswordRegex,
  hashPassword,
  validatePassword,
  generateJWTToken,
  generateSecureOTP,
  isValidEmail,
  getPageAndLimit,
  calculatePagination,
  isValidMongoDBId,
  convertDateTimezoneAndFormat,
};
