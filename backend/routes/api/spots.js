const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User } = require('../../db/models');

// const { check } = require('express-validator');
// const { handleValidationErrors } = require('../../utils/validation');

// const validateSignup = [
//     check('email')
//       .exists({ checkFalsy: true })
//       .isEmail()
//       .withMessage('Invalid email'),
//     handleValidationErrors
// ];

router.get(
    '/spots',
    async (req, res) => {
      const spots = await Spots.findAll({});
      res.status(200);
      return res.json(spots)
    });

router.get(
    '/spots/current',
    requireAuth,
    async (req, res) => {
        await restoreUser(req, res, next);
        if (req.user) {
            const spots = await Spots.findAll({
              where: { ownerId: req.user.id },
              include: [{
                model: Images,
                through: {
                  attributes: [ [url, previewImage] ]
                }
              }]
            });
            res.status(200);
            return res.json(spots);
          }
        });

router.get(
        '/spots/:spotId',
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

router.post(
        '/spots',
                requireAuth,
                async (req, res, next) => {
                  try {

                    await restoreUser(req, res, next);

                    const { address, city, state, country, lat, lng, name, description, price } = req.body;

                    let errorResult = { message: 'Validation error', statusCode: 400, errors: [] };

                    //check input validity
                    if (!(address)) {
                      errorResult.errors.push('Street address is required');
                    }
                    if (!(city)) {
                      errorResult.errors.push('City is required');
                    }
                    if (!(state)) {
                      errorResult.errors.push('State is required');
                    }
                    if (!(country)) {
                      errorResult.errors.push('City is required');
                    }
                    if (!(lat)) {
                      errorResult.errors.push('Latitude is not valid');
                    }
                    if (!(lng)) {
                      errorResult.errors.push('Longitude is not valid');
                    }
                    if (!(name) || name.length > 50) {
                      errorResult.errors.push('Name must be less than 50 characters');
                    }
                    if (!(description)) {
                      errorResult.errors.push('Description is required');
                    }
                    if (!(price)) {
                      errorResult.errors.push('Price per day is required');
                    }


                    if (errorResult.errors.length > 0) {
                      res.status(400);
                      return res.json(errorResult);
                    }



                    const newSpot = await Spot.create({
                      "ownerId": req.user.id,
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


                  } catch (err) {
                    next({
                      status: "error",
                      message: 'Could not create new spot',
                      details: err.errors ? err.errors.map(item => item.message).join(', ') : err.message
                    });
                  }
                });

module.exports = router;
