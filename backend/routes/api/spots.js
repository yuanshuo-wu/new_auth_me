const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { restoreUser } = require('../../utils/auth');
const { Spot, User } = require('../../db/models');

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

router.get(
  '/',
  async (req, res) => {
    const spot = await Spot.findAll({
      include: [{
        model: Images,
      }],
    });
    const spotObjects = [];
    for (let i = 0; i < spots.length; i++) {
      const spot = spots[i];
      spotObjects.push(spot.toJSON());
    }
    for (let i = 0; i < spotObjects.length; i++) {
      const spot = spotObjects[i];
      if (spot.Images.length > 0) {
        for (let j = 0; j < spot.Images.length; j++) {
          const image = spot.Images[j];
          if (image.preview === true) {
            spot.previewImage = image.url
          }
        }
        if (!spot.previewImage) {
          spot.previewImage = "No Image"
        }
      }
      else {
        spot.previewImage = "No Image"
      }
    }
    delete spots.Images;

    res.status(200);
    return res.json(spotObjects)
  });

router.get(
  '/current',
  requireAuth,
  async (req, res) => {
    await restoreUser(req, res, next);
    if (req.user) {
      const spots = await Spot.findAll({
        where: { ownerId: req.user.id },
        include: [{
          model: Images,
          through: {
            attributes: [[url, previewImage]]
          }
        }]
      });
      res.status(200);
      return res.json(spots);
    }
  });

router.get(
  '/:spotId',
  async (req, res, next) => {
    let spot;

    spot = await Spot.findByPk(req.params.spotId);


    if (spot) {
      res.status(200);
      res.json(spot);
    } else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: 'Spot couldn\'t be found',
      });
    }
  });


//                   }
//                   catch (err) {
//                     next({
//                       status: "error",
//                       message: 'Could not create new spot',
//                       details: err.errors ? err.errors.map(item => item.message).join(', ') : err.message
//                     });
//                   }
//                 });

router.post(
  '/',
  restoreUser,validateSpot,
  // requireAuth,
  async (req, res, next) => {
    // await restoreUser(req, res, next);
     const { address, city, state, country, lat, lng, name, description, price } = req.body;
     const currentId = req.user.id

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

    res.status(201);
    return res.json(newSpot);
  });

module.exports = router;
