const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/v1/mysql'); // Assuming you're using the `sequelize` instance

// Define the model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone_code: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  profile_picture: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  auth_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  fcm_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  email_verification_otp: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  forgot_password_otp: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('0', '1', '2', '3'), // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
    allowNull: false,
    defaultValue: '1',
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'), // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
    allowNull: false,
    defaultValue: 'user',
  },
  is_email_verified: {
    type: DataTypes.BOOLEAN, // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
    allowNull: false,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: sequelize.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    onUpdate: 'SET DEFAULT',
    defaultValue: sequelize.NOW,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true, // Optional: if you want to track createdAt and updatedAt
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// // Define the associations
// User.associate = (models) => {
//     // A User has many Addresses
//     User.hasMany(models.Address, {
//         foreignKey: 'user_id',   // The foreign key in the `Address` model
//         onDelete: 'CASCADE',    // Optional: delete addresses if the user is deleted
//     });
// };

module.exports = User;
