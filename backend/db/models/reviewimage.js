'use strict';
const { Model, Validator } = require('sequelize');

const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) =>{
  class ReviewImage extends Model {

    static associate(models) {
      // define association here
      ReviewImage.belongsTo(models.Review,{
        foreignKey: 'reviewId',
      })
    }
  }
  ReviewImage.init({
    reviewId:{
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    url:{
      type: DataTypes.STRING,
      allowNull: false,
      validate:{
        isUrl:true
      }
    }
  }, {
    sequelize,
    modelName: 'ReviewImage',
  });
  return ReviewImage;
};
