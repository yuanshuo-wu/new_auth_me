const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { restoreUser } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, User, sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

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

//Get all Spots
router.get(
  '/',
  async (req, res) => {
    const spots = await Spot.findAll({
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
    return res.json({ "Spots": spotDatas })
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
        {
          model: Spot,
          attributes: ["id", "ownerId", "address", "city", "state" , "country",
           "lat", "lng", "name", "price"],
        },
        {
          model: ReviewImage,
          attributes: ['id', 'url'],
          ///不知道为什么这个ReviewImage一接上就报错。。。
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



//Create a Review for a Spot based on the Spot’s id
router.post(
  '/:spotId/reviews',
  restoreUser,
  validateSpot,
  async (req, res, next) => {


    const userId = req.user.id;
    const spotId = req.params.spotId;
    const { review, stars } = req.body;
    const existReview = await Review.findOne({ where: { userId: userId } });
    if (existReview) {
      res.status(403);
      return res.json({ "message": "User already has a review for this spot", "statusCode": 403 });
    }

    const spot = await Spot.findByPk(spotId);
    if (spot) {
      let newReview = await Review.create({
        "review": review,
        "stars": stars,
        "spotId": spotId,
        "userId": userId
      });
      res.status(200);
      return res.json(newReview);
    }
    else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: "Spot couldn't be found",
      });
    }
  });


//Get details of a Spot from an id
router.get(
  '/:spotId',
  async (req, res, next) => {

    const spot = await Spot.findByPk(req.params.spotId, {
      rejectOnEmpty: true,
      include: [
      {
        model: SpotImage,
        attributes: ['id', 'url', 'preview'],
      },
      {
        model: Review,
        // attributes: ['stars'],
        attributes: [
          [sequelize.fn('count', sequelize.col('stars')), 'numReving'],
          [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating']
        ],
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
        message: "Spot couldn't be found",
      });
    }
    else {

      jSpot.numReviews = jSpot.Reviews[0].numReving;
      jSpot.avgStarRating = jSpot.Reviews[0].avgRating;

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
      let editSpot = await Spot.update({
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

      res.status(200);
      return res.json(spot);
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
