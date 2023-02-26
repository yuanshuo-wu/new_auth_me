const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { restoreUser } = require('../../utils/auth');
const { Spot, SpotImage, Review, ReviewImage, User, sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

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


const validateReviewImage = [
  check('url')
    .exists({ checkFalsy: false })
    .notEmpty()
    .isURL()
    .withMessage('url is not valid'),
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


//Get all Reviews of the Current User
router.get(
  '/current',
  restoreUser,
  async (req, res) => {
    const id = req.user.id;


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
        userId: id
      }
    });

    const reviewDatas = organizeReviews(reviews);
    res.status(200);
    return res.json({ "Reviews": reviews })
  });


//  Get all Reviews by a Spot’s id
//是在spot里实现
//Create a Review for a Spot based on the Spot’s id
//是在spot里实现


// //Get details of a Spot from an id
// router.get(
//   '/:spotId',
//   async (req, res, next) => {

//     const spot = await Spot.findByPk(req.params.spotId, {
//       rejectOnEmpty: true,
//       include: [{
//         model: SpotImage,
//         attributes: ['id', 'url', 'preview'],
//       },
//       {
//         model: Review,
//         // attributes: ['stars'],
//         attributes: [
//           [sequelize.fn('count', sequelize.col('stars')), 'numReving'],
//           [sequelize.fn('AVG', sequelize.col('stars')), 'avgRating']
//         ],
//         raw: true,

//       },
//       {
//         model: User, as: 'Owner',
//         attributes: ['id', 'firstName', 'lastName'],
//       }
//       ]
//     });

//     const jSpot = spot.toJSON();
//     if (jSpot.id === null) {
//       res.status(404);
//       return res.json({
//         statusCode: 404,
//         message: 'Spot couldn\'t be found',
//       });
//     }
//     else {

//       jSpot.numReviews = jSpot.Reviews[0].numReving;
//       jSpot.avgStarRating = jSpot.Reviews[0].avgRating;

//       delete jSpot.Reviews;

//       res.status(200);
//       res.json(jSpot);
//     }

//   });

// //Create a Spot
// router.post(
//   '/',
//   //restoreUser, 我这没有验证机制，你测试的时候把这行的注释取消。
//   validateReview,
//   async (req, res, next) => {
//     const { address, city, state, country, lat, lng, name, description, price } = req.body;
//     const currentId = 1; //req.user.id,取消注释

//     let newSpot = await Spot.create({
//       "ownerId": currentId,
//       "address": address,
//       "city": city,
//       "state": state,
//       "country": country,
//       "lat": lat,
//       "lng": lng,
//       "name": name,
//       "description": description,
//       "price": price
//     });

//     res.status(200);
//     return res.json(newSpot);
//   });



//Add an Image to a Review based on the Review’s id
router.post(
  '/:reviewId/images',
  restoreUser,
  validateReviewImage,
  async (req, res, next) => {
    const { url } = req.body;
    const reviewId = req.params.reviewId;

    const review = await Review.findByPk(reviewId);
    if (review) {

      const { count, rows } = await ReviewImage.findAndCountAll({
        where: {
          reviewId: reviewId
        },
      });
      if (count < 10) {
        let newReviewImage = await ReviewImage.create({
          "reviewId": reviewId,
          "url": url,
        });


        res.status(200);
        return res.json({
          id: newReviewImage.id,
          url: newReviewImage.url,

        });
      }
      else {
        res.status(403);
        return res.json(
          { "message": "Maximum number of images for this resource was reached", "statusCode": 403 }
        );

      }
    }
    else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: 'Review couldn\'t be found',
      });
    }
  });


//Edit a review
router.put(
  '/:reviewId',
  restoreUser,
  validateReview,
  async (req, res, next) => {

    const reviewId = req.params.reviewId;
    const theReview = await Review.findByPk(reviewId);
    if (theReview) {

      const { review, stars } = req.body;
      let editreview = await Review.update({
        "review": review,
        "stars": stars,
      },{
        where:{id:reviewId}
      });

      // const theReview = await Review.findByPk(reviewId);

      res.status(200);
      return res.json(theReview);
    }
    else {
      res.status(404);
      return res.json({
        statusCode: 404,
        message: 'Review couldn\'t be found',
      });
    }
  });


//Delete a Review
router.delete(
  '/:reviewId',
  restoreUser,
  async (req, res, next) => {

    const reviewId = req.params.reviewId;
    const review = await Review.findByPk(reviewId);
    if (review) {
      await Review.destroy({
        where: {
          id: reviewId,
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
        message: 'Review couldn\'t be found',
      });
    }
  });


module.exports = router;