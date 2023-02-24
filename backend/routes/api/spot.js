const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email'),
    handleValidationErrors
];

router.post(
    '/',
    validateSignup,
    async (req, res) => {
      const { firstName, lastName, email, password, username } = req.body;
      const user = await User.signup({ firstName, lastName, email, username, password });

      await setTokenCookie(res, user);

      return res.json({
        user: user.toSafeObject(),
        token: req.cookies.token
      });
    }
);


module.exports = router;
