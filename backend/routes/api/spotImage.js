const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { restoreUser } = require('../../utils/auth');
const { Spot, SpotImage, User, sequelize } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { where } = require('sequelize');


//Delete a Spot Image
router.delete(
  '/:imageId',
  restoreUser, 
  async (req, res, next) => {

    const imageId = req.params.imageId;
    const image = await SpotImage.findByPk(imageId);
    if (image) {
      await SpotImage.destroy({
        where: {
          id: imageId,
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
        message: 'Spot Image couldn\'t be found',
      });
    }
  });


module.exports = router;
