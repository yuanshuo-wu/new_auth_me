const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');

const spotsRouter = require('./spots.js');
// GET /api/restore-user
const { restoreUser } = require('../../utils/auth.js');

router.use(restoreUser);

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/users', spotsRouter);

// router.post('/test', function(req, res) {
//     res.json({ requestBody: req.body });
// });


module.exports = router;
