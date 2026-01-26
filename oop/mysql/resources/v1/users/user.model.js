const Sequelize = require('sequelize');

module.exports = class UserModel extends Sequelize.Model {
  static init(sequelize, DataTypes) {
    return super.init(
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
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        forgot_password_otp: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: null,
        },
        status: {
          type: DataTypes.ENUM('0', '1', '2', '3'), // 0 => In-active, 1 => Active, 2 => Blocked, 3 => Deleted
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
      },
      {

        modelName: 'User',
        tableName: 'users',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        timestamps: true,
        sequelize,
      },
    );
  }

  // Example association method for relationships with other models
  // static associate(models) {
  //     this.relationship = this.hasOne(models.UserProfile, {
  //         as: 'user_profiles',
  //         foreignKey: 'user_id',
  //         onDelete: 'SET NULL', // If user is deleted, set user_id to NULL in UserProfile
  //     })
  // }
};
