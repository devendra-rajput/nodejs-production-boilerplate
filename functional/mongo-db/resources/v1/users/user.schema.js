const mongoose = require('mongoose');

const UsersSchema = new mongoose.Schema({
  email: { type: String, default: '' },
  password: { type: String, required: true },
  user_info: {
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
  },
  phone_code: { type: String, default: '' },
  phone_number: { type: String, default: '' },
  profile_picture: { type: String, default: '' },
  tokens: {
    auth_token: { type: String, default: '' },
    fcm_token: { type: String, default: '' },
  },
  otp: {
    email_verification: { type: String, default: '' },
    forgot_password: { type: String, default: '' },
  },
  status: { type: String, enum: ['0', '1', '2', '3'], default: '1' }, // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  is_email_verified: { type: Boolean, default: false },
  deleted_at: { type: String, default: '' },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});

const Users = mongoose.model('users', UsersSchema, 'users');

module.exports = Users;
