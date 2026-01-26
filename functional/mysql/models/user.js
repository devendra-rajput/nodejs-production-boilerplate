/**
 * User Model Definition
 */

const UserSchema = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
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
        unique: true,
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
        type: DataTypes.STRING(6),
        allowNull: true,
        defaultValue: null,
      },
      forgot_password_otp: {
        type: DataTypes.STRING(6),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM('0', '1', '2', '3'), // 0=>Inactive, 1=>Active, 2=>Blocked, 3=>Deleted
        allowNull: false,
        defaultValue: '1',
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      underscored: true, // Automatically handles snake_case for timestamps
      timestamps: true,
      paranoid: true, // Enables the 'deleted_at' soft-delete functionality
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  );

  /**
   * Define Associations
   */
  // User.associate = (models) => {
  //   // Example: User.hasMany(models.Address, { foreignKey: 'user_id' });
  // };

  return User;
};

module.exports = UserSchema;
