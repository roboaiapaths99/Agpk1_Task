const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attachment.controller');
const upload = require('../../../middlewares/upload');
const { authenticate } = require('../../../middlewares/auth');

router.use(authenticate);

router.post('/upload', upload.single('file'), ctrl.upload);
router.get('/task/:taskId', ctrl.getByTask);
router.get('/project/:projectId', ctrl.getByProject);
router.get('/download/:id', ctrl.download);
router.delete('/:id', ctrl.delete);

module.exports = router;
