// backend/routes/api/session.js
const express = require('express')

const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');


const validateLogin = [
    check('credential')
      .exists({ checkFalsy: true })
      .notEmpty()
      .withMessage('Email or username is required'),
    check('password')
      .exists({ checkFalsy: true })
      .withMessage('Password is required'),
    handleValidationErrors
];


// Log in
router.post(
    '/',
    validateLogin,
    async (req, res, next) => {
      const { credential, password } = req.body;

      const user = await User.login({ credential, password });

      if(!user){
      res.status(401)
        return res.json({
            message: "Invalid credentials",
            statusCode: 401
        })
      }

      // if (!user) {
      //   const err = new Error('Validation error');
      //   err.status = 401;
      //   err.title = 'Validation error';
      //   err.errors = { credential: "Invalid credentials" };
      //   return next(err);
      // }

      // if (!body) {
      //   res.status(400)
      //   return res.json({
      //       message: 'The requested boardgame could not be found',
      //       statusCode: 400,
      //       errors:{ credential: 'Email or username is required', password: "Password is required" }
      //   })
      // }
      // res.json(body)

      await setTokenCookie(res, user);

      return res.json({
        user: user.toSafeObject(),
      });
    }
  );

// Log out
router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
);

// Restore session user
router.get(
    '/',
    restoreUser,
    (req, res) => {
      const { user } = req;
      if (user) {
        return res.json({
          user: user.toSafeObject()
        });
      } else return res.json({ user: null });
    }
);

module.exports = router;
