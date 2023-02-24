// backend/routes/api/users.js
const express = require('express')
const router = express.Router();

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const validateSignup = [
    check('email')
      .exists({ checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email'),
    check('firstName')
      .exists({ checkFalsy: false })
      .notEmpty()
      .withMessage('firstName is required'),
    check('lastName')
      .exists({ checkFalsy: false })
      .notEmpty()
      .withMessage('lastName is required'),
    check('username')
      .exists({ checkFalsy: true })
      .isLength({ min: 4 })
      .withMessage('Please provide a username with at least 4 characters.'),
    check('username')
      .exists({ checkFalsy: false })
      .notEmpty()
      .withMessage('Username is required'),
    check('username')
      .not()
      .isEmail()
      .withMessage('Username cannot be an email.'),
    // check('password')
    //   .exists({ checkFalsy: true })
    //   .isLength({ min: 6 })
    //   .withMessage('Password must be 6 characters or more.'),
    handleValidationErrors
];


// Sign up
router.post(
   '/',
   validateSignup,
   async (req, res) => {
   const { firstName, lastName, email, password, username } = req.body;
   const isexistemail = await User.isexist(email);
   if (isexistemail) {
       res.status(403)
       return res.json({
        message: "User already exist",
        statusCode: 403,
        errors: { "email": "User with that email already exists" }
      });
    }

      const isexistusername = await User.isexist(username);
      if (isexistusername) {
        res.status(403)
        return res.json({
          message: "User already exist",
          statusCode: 403,
          errors: { "username": "User with that username already exists" }
        });
      }

      const user = await User.signup({ firstName, lastName, email, username, password });

      // const tokenStr = await setTokenCookie(res, user);

      return res.json(
        user.toSafeObject(),
      );

    }
  );

module.exports = router;
