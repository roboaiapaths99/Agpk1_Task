const router = require('express').Router();
const viewController = require('../controllers/view.controller');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.get('/kanban', viewController.kanban);
router.get('/calendar', viewController.calendar);
router.get('/timeline', viewController.timeline);
router.get('/my-tasks', viewController.myTasks);
router.get('/overdue', viewController.overdue);
router.get('/workload', viewController.workload);

router.post('/', viewController.saveView);
router.get('/', viewController.getSavedViews);
router.delete('/:id', viewController.deleteSavedView);

module.exports = router;
