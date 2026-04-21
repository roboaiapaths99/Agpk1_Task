const router = require('express').Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../../../middlewares/auth');
const { authorize, requirePermission } = require('../../../middlewares/rbac');
const { validate } = require('../../../middlewares/validate');
const { cacheMiddleware } = require('../../../middlewares/cache.middleware');
const { createTaskSchema, updateTaskSchema, assignTaskSchema, changeStatusSchema, bulkCreateSchema } = require('../validators/task.validator');

router.use(authenticate);

router.post('/', validate(createTaskSchema), taskController.create);
router.get('/', cacheMiddleware(300), taskController.getAll);
router.post('/bulk', validate(bulkCreateSchema), taskController.bulkCreate);
router.get('/:id', cacheMiddleware(600), taskController.getById);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', requirePermission('tasks:delete'), taskController.remove);
router.post('/:id/assign', validate(assignTaskSchema), taskController.assign);
router.patch('/:id/status', validate(changeStatusSchema), taskController.changeStatus);
router.post('/:id/watchers', taskController.addWatcher);
router.delete('/:id/watchers', taskController.removeWatcher);
router.get('/:id/subtasks', taskController.getSubTasks);
router.post('/:id/dependencies', taskController.addDependency);
router.delete('/:id/dependencies', taskController.removeDependency);

module.exports = router;
