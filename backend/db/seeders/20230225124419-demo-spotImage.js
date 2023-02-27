'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {

    options.tableName = 'SpotImages'
    return queryInterface.bulkInsert(options, [
      {
       url: '127.0.0.1/1.jpg',
       preview: true,
       spotId: 1
     },
    ])
  },

  async down(queryInterface, Sequelize) {

    options.tableName = 'SpotImages'
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      url: {
        [Op.in]: ['127.0.0.1/1.jpg']
      }
    }, {})
  }
};
