const pool = require('../config/db'); 


exports.getStudentCourseCompletion = async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const courseId = parseInt(req.params.courseId);

  if (isNaN(studentId) || isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid student or course ID format' });
  }

  
  

  try {
      const [completedLessons] = await pool.execute(
          'SELECT ulc.lesson_id FROM user_lesson_completions ulc JOIN lessons l ON ulc.lesson_id = l.id WHERE ulc.user_id = ? AND l.course_id = ?',
          [studentId, courseId]
      );

      
      const completedLessonIds = completedLessons.map(item => item.lesson_id);
      res.json({ completedLessonIds });

  } catch (error) {
      console.error("Get Student Course Completion Error:", error);
      res.status(500).json({ message: 'Error fetching student completion data' });
  }
};

exports.checkLessonCompletion = async (req, res) => {
  
  const userId = req.user?.userId;
  
  const { lessonId } = req.params;

  
  if (!userId || !lessonId) {
    return res.status(400).json({ message: 'User ID and Lesson ID are required' });
  }

  const id = parseInt(lessonId);
  if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid lesson ID format' });
  }


  try {
    
    const [rows] = await pool.execute(
      'SELECT 1 FROM user_lesson_completions WHERE user_id = ? AND lesson_id = ? LIMIT 1',
      [userId, id]
    );

    
    const isCompleted = rows.length > 0;

    res.json({ completed: isCompleted });

  } catch (error) {
    console.error("Check Lesson Completion Error:", error);
    res.status(500).json({ message: 'Error checking lesson completion status' });
  }
};

exports.markLessonCompleted = async (req, res) => {
  const { userId, lessonUrl } = req.body;

  
  if (!userId || !lessonUrl) {
    return res.status(400).json({ message: 'userId and lessonUrl are required' });
  }
  
  const parsedUserId = parseInt(userId);
  if (isNaN(parsedUserId) || parsedUserId <= 0) {
      return res.status(400).json({ message: 'Invalid userId format' });
  }
  
   if (typeof lessonUrl !== 'string' || lessonUrl.trim() === '') {
       return res.status(400).json({ message: 'lessonUrl must be a non-empty string' });
   }
  


  let connection; 
  try {
    connection = await pool.getConnection(); 
    await connection.beginTransaction(); 

    
    const [lessons] = await connection.execute(
      'SELECT id FROM lessons WHERE external_url = ? LIMIT 1',
      [lessonUrl]
    );

    if (lessons.length === 0) {
      await connection.rollback(); 
      connection.release(); 
      return res.status(404).json({ message: 'Lesson not found for the provided URL' });
    }
    const lessonId = lessons[0].id;

    
    const [users] = await connection.execute(
        'SELECT id FROM users WHERE id = ? LIMIT 1',
        [parsedUserId]
    );
    if (users.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: 'User not found' });
    }


    
    
    
    try {
        const [result] = await connection.execute(
            'INSERT INTO user_lesson_completions (user_id, lesson_id) VALUES (?, ?)',
            [parsedUserId, lessonId]
        );

        
        if (result.affectedRows > 0) {
            await connection.commit(); 
            res.status(201).json({ message: 'Lesson marked as completed successfully' }); 
        } else {
            
            await connection.rollback();
            res.status(400).json({ message: 'Could not mark lesson as completed' });
        }

    } catch (insertError) {
        await connection.rollback(); 

        
        if (insertError.code === 'ER_DUP_ENTRY') {
          
          res.status(200).json({ message: 'Lesson already marked as completed by this user' }); 
        } else {
          
          throw insertError; 
        }
    }

  } catch (error) {
    console.error("Mark Lesson Completed Error:", error);
    
    if (connection) {
        try { await connection.rollback(); } catch (rbError) { console.error("Rollback Error:", rbError); }
    }
    res.status(500).json({ message: 'Server error while marking lesson as completed' });
  } finally {
    
    if (connection) {
      connection.release();
    }
  }
};