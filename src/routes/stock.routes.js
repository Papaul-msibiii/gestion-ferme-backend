const router = require('express').Router();
const ctrl   = require('../controllers/stock.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.route('/').get(ctrl.getAll).post(ctrl.create);
router.route('/:id').get(ctrl.getOne).put(ctrl.update).delete(ctrl.remove);

router.route('/:id/mouvements').get(ctrl.getMouvements).post(ctrl.addMouvement);
router.delete('/mouvements/:mid', ctrl.deleteMouvement);

module.exports = router;
