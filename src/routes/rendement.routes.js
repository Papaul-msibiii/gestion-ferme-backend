const router = require('express').Router();
const ctrl   = require('../controllers/rendement.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.route('/').get(ctrl.getAll).post(ctrl.create);
router.route('/:id').get(ctrl.getOne).put(ctrl.update).delete(ctrl.remove);

module.exports = router;
