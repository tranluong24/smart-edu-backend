const express = require('express');
const classController = require('../controllers/class.controller');
const authMiddleware = require('../middleware/authMiddleware'); 
const { isTeacher, isStudent } = require('../middleware/roleMiddleware'); 
const router = express.Router();


router.post('/', authMiddleware, isTeacher, classController.createClass);


router.get('/myclasses', authMiddleware, classController.getMyClasses);


router.post('/join', authMiddleware, isStudent, classController.joinClass);


router.get('/:classId', authMiddleware, classController.getClassDetails);


router.get('/:classId/members', authMiddleware, classController.getClassMembers);

router.get('/:classId/courses/:courseId/completions',
    authMiddleware, 
    classController.getClassCourseCompletions
);

module.exports = router;