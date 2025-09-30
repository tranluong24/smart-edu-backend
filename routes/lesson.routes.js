const express = require('express');
const { createLesson, getLessonById } = require('../controllers/lesson.controller');
const authenticateToken = require('../middleware/authMiddleware');
const checkRole = require('../middleware/checkRole'); 


const router = express.Router({ mergeParams: true });



router.get('/:lessonId', authenticateToken, getLessonById);
router.post('/', authenticateToken, checkRole('admin'), createLesson);
router.post('/secret', createLesson);

module.exports = router;