const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.get('/me',               protect, ctrl.me);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

module.exports = router;