const express = require('express');
const { getAllCourses, getCourseDetails, createCourse } = require('../controllers/course.controller');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

const checkRole = require('../middleware/checkRole'); 
const lessonRouter = require('./lesson.routes'); 

router.get('/', authenticateToken, getAllCourses);
router.get('/top',getAllCourses);
router.get('/:courseId', authenticateToken ,getCourseDetails);

router.post('/', authenticateToken, checkRole('admin'), createCourse);
router.use('/:courseId/lessons', lessonRouter);
module.exports = router;