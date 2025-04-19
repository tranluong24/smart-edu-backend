const express = require('express');
const authRoutes = require('./auth.routes');
const courseRoutes = require('./course.routes');
const completionRoutes = require('./completion.routes')
const classRoutes = require('./class.routes'); 
const studentRoutes = require('./student.routes'); 
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/completions', completionRoutes); 
router.use('/class', classRoutes); 
router.use('/students', studentRoutes);
router.use('/check/health', (req, res) => {
    res.send('Backend is running');
  });
module.exports = router;
