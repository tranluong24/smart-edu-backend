const express = require('express');
const { markLessonCompleted, checkLessonCompletion, getStudentCourseCompletion } = require('../controllers/completion.controller');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');



router.post('/complete-lesson', markLessonCompleted);
router.get('/complete-lesson/:studentId/:courseId', authenticateToken, getStudentCourseCompletion );
router.get('/complete-lesson/:lessonId', authenticateToken, checkLessonCompletion);


module.exports = router;