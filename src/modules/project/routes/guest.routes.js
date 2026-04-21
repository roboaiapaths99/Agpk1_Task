const router = require('express').Router();
const ctrl = require('../controllers/guest.controller');
const { authenticate } = require('../../../middlewares/auth');

// Public route - uses token for access
router.get('/:token', ctrl.getGuestProject);

// Protected route - only for project members to create links
router.post('/create', authenticate, ctrl.createGuestLink);

module.exports = router;
