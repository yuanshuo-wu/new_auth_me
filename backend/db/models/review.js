'use strict';
const { Model, Validator } = require('sequelize');

const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) =>{
  class Review extends Model {

    static associate(models) {
      // define association here
      Review.hasMany(models.ReviewImage,{
        foreignKey : 'ownerId',
        onDelete : 'CASCADE',
        // hooks: true
      })
      Review.belongsTo(models.Spot,{
        foreignKey: 'spotId',
      })
      Review.belongsTo(models.User,{
        foreignKey: 'userId',
      })
    }
  }
  Review.init({
    spotId: {
      type:DataTypes.INTEGER,
      allowNull: false,
    },
    userId:{
      type:DataTypes.INTEGER,
      allowNull: false,
    },
    review: {
      type:DataTypes.STRING,
      allowNull: false,
    },
    stars: {
      type:DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};
