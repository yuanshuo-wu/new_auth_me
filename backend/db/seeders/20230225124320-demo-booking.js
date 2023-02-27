'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up (queryInterface, Sequelize) {

   options.tableName = 'Bookings';
   return queryInterface.bulkInsert(options, [
    {
        spotId: 1,
        userId: 1,
        startDate: new Date(2023,2,28),
        endDate: new Date(2023,3,8)
      },
    ])
  },

  async down(queryInterface, Sequelize) {
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      id: { [Op.in]: [1] }
    }, {});
  }
};
