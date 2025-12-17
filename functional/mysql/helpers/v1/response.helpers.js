const i18n = require('../../config/i18n');

const sendResponse = async (code, msg, res, data) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');

  const responseBody = {
    statusCode: code,
    api_ver: process.env.API_VER || 'v1',
    message: i18n.__(msg),
  };

  if (data) responseBody.data = data;

  return res.status(code).send(responseBody);
};

const success = async (msg, res, data) => {
  sendResponse(200, msg, res, data);
};

const created = async (msg, res, data) => {
  sendResponse(201, msg, res, data);
};

const disallowed = async (msg, res, data) => {
  sendResponse(405, msg, res, data);
};

const noContent = async (msg, res, data) => {
  sendResponse(204, msg, res, data);
};

const badRequest = async (msg, res, data) => {
  sendResponse(400, msg, res, data);
};

const validationError = async (msg, res, data) => {
  sendResponse(422, msg, res, data);
};

const unauthorized = async (msg, res, data) => {
  sendResponse(401, msg, res, data);
};

const forbidden = async (msg, res, data) => {
  sendResponse(403, msg, res, data);
};

const notFound = async (msg, res, data) => {
  sendResponse(404, msg, res, data);
};

const exception = async (msg, res, data) => {
  sendResponse(500, msg, res, data);
};

const conflict = async (msg, res, data) => {
  sendResponse(409, msg, res, data);
};

const custom = async (code, msg, res, data) => {
  sendResponse(code, msg, res, data);
};

const redirect = async (url, res) => res.status(302).send({
  api_ver: process.env.API_VER,
  redirect_to: url,
});

const twoFactorEnabled = async (res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res.status(200).send({
    api_ver: process.env.API_VER,
    msg: 'TwoFactor authentication has been enabled for your account. We have sent you an access code to the phone associated to your account. Please verify the code to proceed',
    two_factor: true,
  });
};

module.exports = {
  success,
  created,
  disallowed,
  noContent,
  badRequest,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  exception,
  conflict,
  custom,
  redirect,
  twoFactorEnabled,
  sendResponse,
};
