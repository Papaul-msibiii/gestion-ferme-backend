const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/meteo.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.route('/')
  .get(ctrl.getAll)
  .post(ctrl.create);

router.route('/:id')
  .put(ctrl.update)
  .delete(ctrl.remove);

module.exports = router;
