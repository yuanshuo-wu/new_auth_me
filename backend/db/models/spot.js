'use strict';
const { Model, Validator } = require('sequelize');

const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {

    static associate(models) {
      // define association here
      Spot.hasMany(models.SpotImage,{
        foreignKey : 'spotId',
        onDelete: 'CASCADE',
        // hooks: true
      })

      Spot.hasMany(models.Review,{
        foreignKey : 'spotId',
        onDelete: 'CASCADE',
        // hooks: true
      })

      Spot.belongsTo(models.User,{
         foreignKey: 'ownerId',
        //  hooks:true
      })

      Spot.belongsToMany(models.User,{
        through : 'Booking',
        foreignKey : 'spotId',
        otherKey : 'userId',
        onDelete: 'CASCADE',
       //  hooks:true
      });

    }
  }
  Spot.init({

    ownerId: {
      type: DataTypes.INTEGER,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lat: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      validate: {
        len: [0, 50],
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },


    // avgRating: {
    //   type: DataTypes.FLOAT,
    // },
    previewImage: {
      type: DataTypes.STRING
    }
  },

    {
      sequelize,
      modelName: "Spot",
      // defaultScope: {
      //    attributes: {
      //      exclude: ["createdAt", "updatedAt"]
      //    }
      //  }
    }

  );
  return Spot;
};
