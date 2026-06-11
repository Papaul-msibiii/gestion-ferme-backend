const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/rapport.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', ctrl.get);

module.exports = router;
