const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/customField.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.post('/', ctrl.create);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/reorder', ctrl.reorder);

module.exports = router;
