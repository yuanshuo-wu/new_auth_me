'use strict';
/** @type {import('sequelize-cli').Migration} */

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Spots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ownerId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users' },
        //onDelete: 'CASCADE'????
      },
      address: {
        type: Sequelize.STRING,
          allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lat: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      lng: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,

      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },

      // avgRating: {
      //   type: Sequelize.FLOAT
      // },
      // previewImage: {
      //   type: Sequelize.STRING
      // },

    }, options);
  },
  down: async (queryInterface, Sequelize) => {
    options.tableName = "Spots";
    return queryInterface.dropTable(options);
  }
};
