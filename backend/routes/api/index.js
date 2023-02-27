const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');

const spotsRouter = require('./spots.js');
const reviewsRouter = require('./reviews.js');
const bookRouter = require('./bookings.js');

const reviewImagesRouter = require('./reviewImage.js')
const spotImagesRouter = require('./spotImage.js');
// GET /api/restore-user
const { restoreUser } = require('../../utils/auth.js');

router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/spots', spotsRouter);

router.use('/reviews', reviewsRouter);

router.use('/bookings', bookRouter);

router.use('/ReviewImage', reviewImagesRouter);
router.use('/SpotImage', spotImagesRouter);

// router.post('/test', function(req, res) {
//     res.json({ requestBody: req.body });
// });

module.exports = router;
