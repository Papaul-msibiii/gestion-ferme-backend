const router = require('express').Router();
const ctrl   = require('../controllers/rentabilite.controller');
const { protect, authorize, injectOrgFilter } = require('../middlewares/auth.middleware');

router.use(protect, injectOrgFilter);
router.get('/', authorize('platform_admin','org_admin','manager'), ctrl.get);

module.exports = router;
