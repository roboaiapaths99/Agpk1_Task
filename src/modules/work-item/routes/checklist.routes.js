const router = require('express').Router();
const checklistController = require('../controllers/checklist.controller');
const { authenticate } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validate');
const { addChecklistSchema, updateChecklistItemSchema } = require('../validators/task.validator');

router.use(authenticate);

router.post('/:id/checklists', validate(addChecklistSchema), checklistController.addChecklist);
router.get('/:id/checklists', checklistController.getChecklists);
router.patch('/checklists/:checklistId/items/:itemId', validate(updateChecklistItemSchema), checklistController.updateChecklistItem);
router.post('/checklists/:checklistId/items', checklistController.addItemToChecklist);
router.delete('/checklists/:checklistId', checklistController.deleteChecklist);


module.exports = router;
