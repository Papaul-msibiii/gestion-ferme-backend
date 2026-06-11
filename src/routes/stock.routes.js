const router = require('express').Router();
const ctrl   = require('../controllers/stock.controller');
const { protect, authorize, injectOrgFilter } = require('../middlewares/auth.middleware');

router.use(protect, injectOrgFilter);

const ALL  = ['platform_admin','org_admin','manager','worker'];
const MGMT = ['org_admin','manager'];

router.get('/',    authorize(...ALL),  ctrl.getAll);
router.post('/',   authorize(...MGMT), ctrl.create);
router.get('/:id', authorize(...ALL),  ctrl.getOne);
router.put('/:id', authorize(...MGMT), ctrl.update);
router.delete('/:id', authorize(...MGMT), ctrl.remove);
router.get('/:id/mouvements',  authorize(...ALL),  ctrl.getMouvements);
router.post('/:id/mouvements', authorize(...MGMT), ctrl.addMouvement);
router.delete('/mouvements/:mid', authorize(...MGMT), ctrl.deleteMouvement);

module.exports = router;
