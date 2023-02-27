const express = require('express')
const router = express.Router();

const { Op } = require("sequelize");
const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { restoreUser } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, User,Booking, sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

function formatDate(d) {

  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

if (month.length < 2)
  month = '0' + month;
if (day.length < 2)
  day = '0' + day;

return [year, month, day].join('-');
}

const validateSpot = [
  check('address')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('Street address is required'),
  check('city')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('City is required'),
  check('state')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('State is required'),
  check('country')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('Country is required'),
  check('lat')
    .exists({ checkFalsy: false })
    .notEmpty()
    .isFloat()
    .withMessage('Latitude is not valid'),
  check('lng')
    .exists({ checkFalsy: true })
    .notEmpty()
    .isFloat()
    .withMessage('Longitude is not valid'),
  check('name')
    .exists({ checkFalsy: true })
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('Name must be less than 50 characters'),
  check('description')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('Description is required'),
  check('price')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('Price per day is required'),
  handleValidationErrors
];


const validateSpotImage = [
  check('url')
    .exists({ checkFalsy: false })
    .notEmpty()
    .isURL()
    .withMessage('url is not valid'),
  check('preview')
    .exists({ checkFalsy: false })
    .notEmpty()
    .isBoolean()
    .withMessage('preview is not valid'),
  handleValidationErrors
];


const validateReview = [
  check('review')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('Review text is required'),
  check('stars')
    .exists({ checkFalsy: false })
    .notEmpty()
    .withMessage('Stars must be an integer from 1 to 5'),
  handleValidationErrors
];

function isNumeric(str) {
  if (typeof str != "string") return false
  return !isNaN(str) && !isNaN(parseFloat(str))
}


const organizeReviews = (reviews) => {
  const reviewObjects = [];
  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];
    reviewObjects.push(review.toJSON());


    if (review.ReviewImages.length > 0) {
      for (let j = 0; j < review.ReviewImages.length; j++) {
        const image = review.ReviewImages[j];
        review.previewImage = image.url
      }
      if (!review.previewImage) {
        review.previewImage = "Image URL"
      }
    }
    else {
      review.previewImage = "Image URL"
    }
    delete review.ReviewImages;
  }
  return reviewObjects;
};


const organizeSpots = (spots) => {
  const spotObjects = [];
  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    spotObjects.push(spot.toJSON());
  }
  let avgValue = 0;
  let avgNumber = 0;
  for (let i = 0; i < spotObjects.length; i++) {
    const spot = spotObjects[i];
    if (spot.Reviews.length > 0) {
      for (let j = 0; j < spot.Reviews.length; j++) {
        avgValue += spot.Reviews[j].stars;
        avgNumber++;
      }
    }
    if (avgNumber > 0) {
      spot.avgRating = (avgValue / avgNumber).toFixed(1);;
    }
    else {
      spot.avgRating = '';
    }
    delete spot.Reviews;

    if (spot.SpotImages.length > 0) {
      for (let j = 0; j < spot.SpotImages.length; j++) {
        const image = spot.SpotImages[j];
        if (image.preview === true) {
          spot.previewImage = image.url;
        }
      }
      if (!spot.previewImage) {
        spot.previewImage = "Image URL"
      }
    }
    else {
      spot.previewImage = "Image URL"
    }
    delete spot.SpotImages;
  }
  return spotObjects;
};


const organizeBookings = (bookings,user) => {
  const bookingObjects = [];
  const curuser= { "id": user.id, "firstName": user.firstName, "lastName": user.lastName};

  for (let i = 0; i < bookings.length; i++) {
  const booking = bookings[i];
  const jbooking = booking.toJSON();
  jbooking.User = curuser;
  delete jbooking.Spot;
  bookingObjects.push(jbooking);
  }
    return bookingObjects;
};


//Get all Spots
router.get(
  '/',

  async (req, res) => {
    let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

    const errorMessage = {
      "message": "Validation Error", "statusCode": 400, "errors":{}
    }

    let numberErr=0;
    if (page && page < 1)
    {
      errorMessage.errors.page = 'Page must be greater than or equal to 1';
      numberErr++;
    }

    if (size && size < 1)
    {
      errorMessage.errors.page = 'Size must be greater than or equal to 1';
      numberErr++;
    }


    if (minLat && (!isNumeric(minLat)))
    {
      errorMessage.errors.minLat = 'Minimum latitude is invalid';
      numberErr++;
    }
    if (maxLat && !isNumeric(maxLat))
    {
      errorMessage.errors.minLat = 'MaxLat latitude is invalid';
      numberErr++;
    }
    if (minLng && !isNumeric(minLng))
    {
      errorMessage.errors.minLat = 'MinLng latitude is invalid';
      numberErr++;
    }
    if (maxLng && !isNumeric(maxLng))
    {
      errorMessage.errors.minLat = 'MaxLng latitude is invalid';
      numberErr++;
    }
    if (minPrice && !isNumeric(minPrice) && minPrice<0 )
    {
      errorMessage.errors.minLat = 'MinPrice price must be greater than or equal to 0';
      numberErr++
    }
    if (maxPrice && !isNumeric(maxPrice) && maxPrice<0 )
    {
      errorMessage.errors.minLat = 'Maximum price must be greater than or equal to 0';
      numberErr++;
    }

    if (numberErr>0)
    {
      res.status(400);
      return res.json(errorMessage);
    }

    // default page and size
    if (!page) page = 1;
    if (!size) size = 20;

    page = parseInt(page);
    size = parseInt(size);

    if (page > 20){
      page = 20;
    }


    const pagination = {};
    pagination.limit = size;
    pagination.offset = size * (page - 1);


    const where = {};
    if (minLat) {
      where.Lat >= minLat;
    }
    if (maxLat) {
      where.Lat <= maxLat;
    }

    if (minLng) {
      where.Lng >= minLng;
    }
    if (maxLng) {
      where.Lng <= maxLng;
    }

    if (minPrice) {
      where.Price >= minPrice;
    }
    if (maxPrice) {
      where.Price <= maxPrice;
    }

    const spots = await Spot.findAll({
      include: [{
        model: SpotImage,
      },
      {
        model: Review,
      }
      ],
      where,
      ...pagination,
    });
    const spotDatas = organizeSpots(spots);

    res.status(200);
    return res.json({
      "Spots": spotDatas,
      "page": page,
      "size": size,
    })
  });



//Get all Spots owned by the Current User
router.get(
  '/current',
  restoreUser,
  async (req, res) => {
    const id = req.user.id;

    if (id) {
      const spots = await Spot.findAll({
        where: { ownerId: id },
        include: [{
          model: SpotImage,
        },
        {
          model: Review,
        }
        ],
      });

      const spotDatas = organizeSpots(spots);
      res.status(200);
      return res.json(spotDatas);
    }
  });

//Get all Reviews by a Spot’s id
router.get(
  '/:spotId/reviews',
  restoreUser,
  async (req, res) => {
    const spotId = req.params.spotId;

    const spot = await Spot.findByPk(spotId);
    if (!spot) {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: "Spot couldn't be found",
      });
    }

    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName'],
        },
        // {
        //   model: Spot,
        //   attributes: ["id", "ownerId", "address", "city", "state" , "country",
        //    "lat", "lng", "name", "price"],
        // },
        {
          model: ReviewImage,
          attributes: ['id', 'url'],
        },
      ],
      where: {
        spotId: spotId
      }
    });

    const reviewDatas = organizeReviews(reviews);
    res.status(200);
    return res.json({ "Reviews": reviews })
  });



//Create a Review for a Spot based on the Spots id
router.post(
  '/:spotId/reviews',
  restoreUser,
  validateReview,
  async (req, res, next) => {

    const userId = req.user.id;
    const spotId = parseInt(req.params.spotId);
    const { review, stars } = req.body;
    const spot = await Spot.findByPk(req.params.spotId, {
      include: { model: Review }
    });

    if (!spot) {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: 'Spot couldn\'t be found',
      });
    }

    const existReview = await Review.findOne({
      where: {
        [Op.and]: [
          { userId: parseInt(userId) },
          { spotId: parseInt(spotId) }],
        }
     });
    if (existReview != null) {
      res.status(403);
      return res.json({ "message": "User already has a review for this spot", "statusCode": 403 });
    }

    let newReview = await Review.create({
      "review": review,
      "stars": stars,
      "spotId": spotId,
      "userId": userId
    });
    res.status(200);
    return res.json(newReview);

  });


//Get details of a Spot from an id
router.get(
  '/:spotId',
  async (req, res, next) => {

    const spot = await Spot.findByPk(req.params.spotId, {
      rejectOnEmpty: true,
      include: [{
        model: SpotImage,
        attributes: ['id', 'url', 'preview'],
      },
      {
        model: Review,
        attributes: ['stars'],
        // attributes: [
        //   [sequelize.fn('count', sequelize.col('stars')), 'numReving'],
        //   [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating']
        // ],
        raw: true,
      },
      {
        model: User, as: 'Owner',
        attributes: ['id', 'firstName', 'lastName'],
      }
      ]
    });

    const jSpot = spot.toJSON();
    if (jSpot.id === null) {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: 'Spot couldn\'t be found',
      });
    }
    else {

      // jSpot.numReviews = jSpot.Reviews[0].numReving;
      // jSpot.avgStarRating = jSpot.Reviews[0].avgRating;

      let avgValue = 0;
      let avgNumber = 0;

      if (spot.Reviews.length > 0) {
        for (let j = 0; j < spot.Reviews.length; j++) {
          avgValue += spot.Reviews[j].stars;
          avgNumber++;
        }
      }
      if (avgNumber > 0) {
        spot.avgRating = (avgValue / avgNumber).toFixed(1);;
      }
      else {
        spot.avgRating = '';
      }

      jSpot.numReviews = avgNumber;
      jSpot.avgStarRating = avgValue;
      delete jSpot.Reviews;

      res.status(200);
      res.json(jSpot);
    }

  });


//Create a Spot
router.post(
  '/',
  restoreUser,
  validateSpot,
  async (req, res, next) => {
    const { address, city, state, country, lat, lng, name, description, price } = req.body;
    const currentId = req.user.id;

    let newSpot = await Spot.create({
      "ownerId": currentId,
      "address": address,
      "city": city,
      "state": state,
      "country": country,
      "lat": lat,
      "lng": lng,
      "name": name,
      "description": description,
      "price": price
    });

    res.status(200);
    return res.json(newSpot);
  });



//Add an Image to a Spot based on the Spot’s id
router.post(
  '/:spotId/images',
  restoreUser,
  validateSpotImage,
  async (req, res, next) => {
    const { url, preview } = req.body;
    const spotId = req.params.spotId;

    const spot = await Spot.findByPk(spotId);
    if (spot) {

      let newSpotImage = await SpotImage.create({
        "spotId": spotId,
        "preview": preview,
        "url": url,
      });


      res.status(200);
      return res.json({
        id: newSpotImage.id,
        url: newSpotImage.url,
        preview: newSpotImage.preview,
      });
    }
    else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: "Spot couldn't be found",
      });
    }
  });


  //Get all Bookings for a Spot based on the Spot’s id
  router.get(
    '/:spotId/bookings',
    restoreUser,

    async (req, res) => {
      const spotId = req.params.spotId;
      const userId = req.user.id;

      const { startDate, endDate } = req.body;

      const spot = await Spot.findByPk(spotId);
      if (!spot) {
        res.status(404);
        return res.json({
          statusCode: 404,
          message: 'Spot couldn\'t be found',
        });
      }


      const bookings = await Booking.findAll({
        include: [{
          model: Spot,
          attributes: {
            exclude: ['createdAt','updatedAt']
          },
          // include:[{model: SpotImage}]
        },
        ],
        where:
          [{spotId: spotId}]
      });


      if (spot.ownerId != userId) {
        res.status(200);

        const bookingObjects = [];
        for (let i = 0; i < bookings.length; i++) {
          const booking = bookings[i];
          const jbooking = booking.toJSON();
          delete jbooking.id;
          delete jbooking.userId;
          delete jbooking.createdAt;
          delete jbooking.updatedAt;
          delete jbooking.Spot;
          bookingObjects.push(jbooking);
        }
        return res.json({ "Bookings": bookingObjects })

      }
      else {
        const bookingDatas = organizeBookings(bookings, req.user);
        res.status(200);
        return res.json({ "Bookings": bookingDatas })
      }

    });


//Create a Booking from a Spot based on the Spot’s id
router.post(
  '/:spotId/bookings',
  restoreUser,
  async (req, res) => {

  const userId = req.user.id;
  const spotId = req.params.spotId;
  const parsedSpot = parseInt(spotId);
  const { startDate, endDate } = req.body;
  const dStart = new Date(startDate);
  const dEnd = new Date(endDate);
  if (dEnd < dStart) {
    res.status(400);
    return res.json({
      "message": "Validation error",
      "statusCode": 400,
      "errors": { "endDate": "endDate cannot be on or before startDate" }
    });
  }


  //date validation
  const conflictError = { "message": "Sorry, this spot is already booked for the specified dates", "statusCode": 403, "errors": [] }
  const existBookings = await Booking.findAll({ where: { spotId: spotId } });
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


  const spot = await Spot.findByPk(spotId);

  if (spot) {
    let newBooking = await Booking.create({
      "startDate": dStart,
      "endDate": dEnd,
      "spotId": parsedSpot,
      "userId": userId
    });
    res.status(200);
    return res.json(newBooking);
    }
  else {
    res.status(404);
    return res.json({
        statusCode: 404,
      message: 'Spot couldn\'t be found',
      });
  }
  });

//Edit a Spot
router.put(
  '/:spotId',
  restoreUser,
  validateSpot,
  async (req, res, next) => {

    const spotId = req.params.spotId;
    const spot = await Spot.findByPk(spotId);
    if (spot) {

      const { address, city, state, country, lat, lng, name, description, price } = req.body;
      // const currentId = req.user.id;
       await Spot.update({
        "address": address,
        "city": city,
        "state": state,
        "country": country,
        "lat": lat,
        "lng": lng,
        "name": name,
        "description": description,
        "price": price
      },{where: {id : spotId}}
      );
      let editSpot =await Spot.findByPk(spotId);

      res.status(200);
      return res.json(editSpot);
    }
    else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: "Spot couldn't be found",
      });
    }
  });


//Delete a Spot
router.delete(
  '/:spotId',
  restoreUser,
  async (req, res, next) => {

    const spotId = req.params.spotId;
    const spot = await Spot.findByPk(spotId);
    if (spot) {
      await Spot.destroy({
        where: {
          id: spotId,
        }
      });
      res.status(200);
      return res.json({
        "message": "Successfully deleted",
        "statusCode": 200
      });
    }
    else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: "Spot couldn't be found",
      });
    }
  });


module.exports = router;
