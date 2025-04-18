const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/authMiddleware');


const router = express.Router();


router.get('/:studentId/info', authMiddleware, studentController.getStudentInfo);

module.exports = router;