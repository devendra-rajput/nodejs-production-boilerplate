const moment = require('moment-timezone');

const timezone = (req, res, next) => {
  const tz = req.headers['x-timezone'] || 'UTC';
  if (moment.tz.zone(tz)) {
    req.timezone = tz;
  } else {
    req.timezone = 'UTC';
  }
  next();
};

module.exports = timezone;
