const router = require('express').Router();
const ctrl = require('../controllers/organization.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

// Membres de l'organisation courante (org_admin + manager peuvent voir)
router.get('/me',         authorize('org_admin', 'manager', 'worker'), ctrl.getMyOrg);
router.patch('/me',       authorize('org_admin'), ctrl.updateMyOrg);
router.get('/members',    authorize('org_admin', 'manager'), ctrl.getMembers);
router.post('/members/invite',       authorize('org_admin'), ctrl.inviteMember);
router.patch('/members/:id/role',    authorize('org_admin'), ctrl.updateMemberRole);
router.delete('/members/:id',        authorize('org_admin'), ctrl.removeMember);

// Platform admin — gestion globale
router.get('/',           authorize('platform_admin'), ctrl.getAllOrgs);
router.patch('/:id/toggle', authorize('platform_admin'), ctrl.toggleOrg);

module.exports = router;
