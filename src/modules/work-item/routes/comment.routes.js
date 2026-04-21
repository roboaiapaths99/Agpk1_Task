const router = require('express').Router();
const commentController = require('../controllers/comment.controller');
const { authenticate } = require('../../../middlewares/auth');
const { validate } = require('../../../middlewares/validate');
const { addCommentSchema } = require('../validators/task.validator');

router.use(authenticate);

router.post('/:id/comments', validate(addCommentSchema), commentController.addComment);
router.get('/:id/comments', commentController.getComments);
router.patch('/comments/:commentId', commentController.updateComment);
router.delete('/comments/:commentId', commentController.deleteComment);

module.exports = router;
