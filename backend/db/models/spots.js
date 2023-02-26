'use strict';
const { Model, Validator } = require('sequelize');

const bcrypt = require('bcryptjs');
module.exports = (sequelize, DataTypes) => {
  class Spot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       Spot.belongsTo(
         models.User,
         { foreignKey: 'ownerId' ,
         as: 'Owner'}
       );

       Spot.hasMany(
         models.SpotImage,
         { foreignKey: 'spotId' }
       );

       
       Spot.hasMany(
        models.Review,
        { foreignKey: 'spotId' }
      );
      
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
    // previewImage: {
    //   type: DataTypes.STRING
    // }
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