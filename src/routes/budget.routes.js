const router = require('express').Router();
const ctrl   = require('../controllers/budget.controller');
const { protect, authorize, injectOrgFilter } = require('../middlewares/auth.middleware');

router.use(protect, injectOrgFilter);

router.get('/',    authorize('platform_admin','org_admin','manager','worker'), ctrl.getAll);
router.post('/',   authorize('org_admin','manager'), ctrl.create);
router.put('/:id', authorize('org_admin','manager'), ctrl.update);
router.delete('/:id', authorize('org_admin','manager'), ctrl.remove);

module.exports = router;
