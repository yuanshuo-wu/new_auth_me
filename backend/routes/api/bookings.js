const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { restoreUser } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, Booking, User, sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { where } = require('sequelize');

const validateBooking = [
  check('startDate')
    .exists({ checkFalsy: false })
    .notEmpty()
    .isDate()
    .withMessage('startDate is not valid'),
  check('endDate')
    .exists({ checkFalsy: false })
    .notEmpty()
    .isDate()
    .withMessage('endDate is not valid'),

  handleValidationErrors
];

const organizeBookings = (bookings) => {
  const bookingObjects = [];
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    const jbooking = booking.toJSON();


    for (let j = 0; j < jbooking.Spot.SpotImages.length; j++) {
      const image = jbooking.Spot.SpotImages[j];
      if (image.preview === true) {
        jbooking.Spot.previewImage = image.url;
      }
    }
    delete jbooking.Spot.SpotImages;

    bookingObjects.push(jbooking);

  }
  return bookingObjects;
};


//-----------------------------------------------------------
//Get all of the Current User’s Bookings
router.get(
  '/current',
  restoreUser,
  async (req, res) => {
    const id = req.user.id;

    if (id) {
      const bookings = await Booking.findAll({
        include: [{
          model: Spot,
          // model: SpotImage,
          attributes: {
            exclude: ['description','createdAt', 'updatedAt']
          },
          //include: [{ model: SpotImage,}]
        },

        ],
        where:[{userId: id}]
      });
      //const bookingDatas = organizeBookings(bookings);

      res.status(200);
      return res.json({ "Bookings": bookings })
    }
  });


//Edit a Booking
router.put(
  '/:bookingId',
  restoreUser,
  validateBooking,
  async (req, res, next) => {

    const bookingId = req.params.bookingId;
    const booking = await Booking.findByPk(bookingId);
    if (booking) {

      const { startDate, endDate } = req.body;
      const dStart = new Date(startDate);
      const dEnd = new Date(endDate);

      if (dEnd < dStart) {
        res.status(400);
        return res.json({
          "message": "Validation error",
          "statusCode": 400,
          "errors": { "endDate": "endDate cannot come before startDate" }
        });
      }


      //检查日期冲突
      const conflictError = { "message": "Sorry, this spot is already booked for the specified dates", "statusCode": 403, "errors": [] }
      const existBookings = await Booking.findAll({ where: { spotId: booking.spotId } });
      for (let i = 0; i < existBookings.length; i++) {
        if (dStart >= existBookings[i].startDate && dStart <= existBookings[i].endDate) {
          conflictError.errors.push('Start date conflicts with an existing booking');
        }
        if (dEnd >= existBookings[i].startDate && dEnd <= existBookings[i].endDate) {
          conflictError.errors.push('End date conflicts with an existing booking');
        }
      }
      if (conflictError.errors.length > 0) {
        res.status(403);
        return res.json(conflictError);
      }

      //检查 is Past bookings
      if(dEnd<booking.endDate)
      {
        res.status(403);
        return res.json({ "message": "Past bookings can't be modified", "statusCode": 403 });
      }


      await Booking.update({
        "startDate": dStart,
        "endDate": dEnd
      },
      { where: { id: bookingId } });

      let editBooking = await Booking.findByPk(bookingId);

      res.status(200);
      return res.json(editBooking);
    }
    else {
      res.status(404);
      return res.json({ "message": "Booking couldn't be found", "statusCode": 404 });
    }
  });


//Delete a Booking
router.delete(
  '/:bookingId',
  restoreUser,
  async (req, res, next) => {

  const bookingId =parseInt(req.params.bookingId);
    const booking = await Booking.findOne(
      {
        where:{
          id: bookingId
        }
    });
    if(!booking) {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: 'Booking couldn\'t be found',
      });
    };
    if (booking) {
      await Booking.destroy({
        where: {
          id: bookingId,
        }
      });
      res.status(200);
      return res.json({
        "message": "Successfully deleted",
        "statusCode": 200
      });
    };
    const { startDate } = req.body;
    if(new Date(startDate) < new Date()) {
      res.status(403);
      return res.json({
        "message" : "Bookings that have been started can't be deleted",
        "statusCode" : 403
      });
    };

  });
module.exports = router;
