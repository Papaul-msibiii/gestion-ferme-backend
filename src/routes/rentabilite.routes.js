const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/rentabilite.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);
router.get('/', ctrl.get);

module.exports = router;
