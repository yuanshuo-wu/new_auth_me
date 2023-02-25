'use strict';
const { Model, Validator } = require('sequelize');

const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {

    static associate(models) {
      // define association here
      Booking.belongsTo(models.Spot,{
        foreignKey: 'spotId',
    })
      Booking.belongsTo(models.User,{
        foreignKey: 'userId',
    })
    }
  }
  Booking.init({
    spotId: {
      type:DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type:DataTypes.INTEGER,
      allowNull: false,
    },
    startDate:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type:DataTypes.DATE,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};
