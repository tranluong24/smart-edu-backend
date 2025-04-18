const pool = require('../config/db');


exports.getLessonById = async (req, res) => {
  const { lessonId } = req.params; 

  const id = parseInt(lessonId);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid lesson ID format' });
  }

  try {
    
    const [lessons] = await pool.execute(
      
      'SELECT id, title, external_url, course_id FROM lessons WHERE id = ?',
      [id]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ message: 'Lesson not found' }); 
    }

    const lesson = lessons[0];

    res.json(lesson); 

  } catch (error) {
    console.error("Get Lesson By ID Error:", error);
    res.status(500).json({ message: 'Error fetching lesson details' });
  }
};

exports.createLesson = async (req, res) => {
  
  const { courseId } = req.params;
  
  let { title, description, externalUrl } = req.body;

  
  if (!title || !externalUrl) {
    return res.status(400).json({ message: 'Lesson title and external URL are required.' });
  }
  if (isNaN(parseInt(courseId))) {
      return res.status(400).json({ message: 'Invalid course ID format.' });
  }

  if (!description || description.trim() === '') {
    description = 'No Description';
  }

  try {
    
    const [courses] = await pool.execute('SELECT id FROM courses WHERE id = ?', [courseId]);
    if (courses.length === 0) {
         return res.status(404).json({ message: 'Course not found. Cannot add lesson.' });
    }

    
    const [result] = await pool.execute(
      'INSERT INTO lessons (course_id, title, description, external_url) VALUES (?, ?, ?, ?)',
      [courseId, title, description, externalUrl]
    );

    res.status(201).json({ message: 'Lesson created successfully', lessonId: result.insertId });

  } catch (error) {
    console.error("Create Lesson Error:", error);
    res.status(500).json({ message: 'Server error creating lesson.' });
  }
};