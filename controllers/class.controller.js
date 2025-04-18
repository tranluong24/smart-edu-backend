const pool = require('../config/db');
const crypto = require('crypto'); 


const generateJoinCode = (length = 6) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') 
    .slice(0, length) 
    .toUpperCase(); 
};


exports.createClass = async (req, res) => {
  const { title, description } = req.body;
  const teacherId = req.user.userId; 

  if (!title) {
    return res.status(400).json({ message: 'Class title is required' });
  }

  let joinCode;
  let codeExists = true;
  let attempts = 0;

  
  while (codeExists && attempts < 5) { 
    joinCode = generateJoinCode(6);
    const [existing] = await pool.execute('SELECT id FROM classes WHERE join_code = ?', [joinCode]);
    if (existing.length === 0) {
      codeExists = false;
    }
    attempts++;
  }

  if (codeExists) {
    
    return res.status(500).json({ message: 'Could not generate a unique join code. Please try again.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO classes (title, description, teacher_id, join_code) VALUES (?, ?, ?, ?)',
      [title, description || null, teacherId, joinCode]
    );
    res.status(201).json({
       message: 'Class created successfully',
       classId: result.insertId,
       joinCode: joinCode 
    });
  } catch (error) {
    console.error("Create Class Error:", error);
    res.status(500).json({ message: 'Server error creating class' });
  }
};


exports.getMyClasses = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    let classes;
    if (userRole === 'teacher') {
      
      [classes] = await pool.execute(
        'SELECT id, title, description, join_code FROM classes WHERE teacher_id = ?',
        [userId]
      );
    } else if (userRole === 'student') {
      
      [classes] = await pool.execute(
        `SELECT c.id, c.title, c.description, c.join_code
         FROM classes c
         JOIN class_members cm ON c.id = cm.class_id
         WHERE cm.user_id = ?
         ORDER BY cm.joined_at DESC`,
        [userId]
      );
    } else {
      return res.status(403).json({ message: 'Invalid user role' });
    }
    res.json(classes);
  } catch (error) {
    console.error("Get My Classes Error:", error);
    res.status(500).json({ message: 'Error fetching classes' });
  }
};


exports.joinClass = async (req, res) => {
  const { joinCode } = req.body;
  const userId = req.user.userId; 

  if (!joinCode) {
    return res.status(400).json({ message: 'Join code is required' });
  }

  try {
    
    const [classes] = await pool.execute(
      'SELECT id, teacher_id FROM classes WHERE join_code = ?',
      [joinCode.toUpperCase()] 
    );

    if (classes.length === 0) {
      return res.status(404).json({ message: 'Invalid join code. Class not found.' });
    }
    const classInfo = classes[0];

    
    if (classInfo.teacher_id === userId) {
       return res.status(400).json({ message: 'Teachers cannot join their own classes as students.' });
    }


    
    const [members] = await pool.execute(
      'SELECT id FROM class_members WHERE user_id = ? AND class_id = ?',
      [userId, classInfo.id]
    );

    if (members.length > 0) {
      return res.status(409).json({ message: 'You are already a member of this class.' }); 
    }

    
    await pool.execute(
      'INSERT INTO class_members (user_id, class_id) VALUES (?, ?)',
      [userId, classInfo.id]
    );

    res.status(200).json({ message: 'Successfully joined the class.' });

  } catch (error) {
    
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'You are already a member of this class.' });
    }
    console.error("Join Class Error:", error);
    res.status(500).json({ message: 'Server error joining class' });
  }
};


exports.getClassDetails = async (req, res) => {
    const classId = parseInt(req.params.classId);
    const userId = req.user.userId;

    if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID format' });
    }

    try {
        
        const [classes] = await pool.execute(
            `SELECT c.id, c.title, c.description, c.teacher_id, c.join_code,
                    (c.teacher_id = ?) AS is_teacher, -- Kiểm tra xem user hiện tại có phải teacher lớp này
                    (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id = c.id AND cm.user_id = ?) > 0 AS is_member -- Kiểm tra xem có phải member
             FROM classes c
             WHERE c.id = ?`,
            [userId, userId, classId] 
        );

        if (classes.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const classInfo = classes[0];

        
        if (!classInfo.is_teacher && !classInfo.is_member) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this class.' });
        }

        
        const responseData = {
            id: classInfo.id,
            title: classInfo.title,
            description: classInfo.description,
            isTeacher: !!classInfo.is_teacher 
        };
        if (classInfo.is_teacher) {
            responseData.joinCode = classInfo.join_code; 
        }


        res.json(responseData);

    } catch (error) {
        console.error("Get Class Details Error:", error);
        res.status(500).json({ message: 'Error fetching class details' });
    }
};



exports.getClassMembers = async (req, res) => {
    const classId = parseInt(req.params.classId);
    const userId = req.user.userId;

     if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID format' });
    }

    try {
        
        const [classes] = await pool.execute(
             `SELECT c.id, c.teacher_id,
                     (c.teacher_id = ?) AS is_teacher,
                     (SELECT COUNT(*) FROM class_members cm WHERE cm.class_id = c.id AND cm.user_id = ?) > 0 AS is_member
              FROM classes c
              WHERE c.id = ?`,
             [userId, userId, classId]
        );

        if (classes.length === 0) {
            return res.status(404).json({ message: 'Class not found' });
        }
        const classInfo = classes[0];
        if (!classInfo.is_teacher && !classInfo.is_member) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to view members of this class.' });
        }

        
        const [members] = await pool.execute(
            `SELECT u.id, u.username, u.email -- Chỉ lấy thông tin cần thiết, không lấy password
             FROM users u
             JOIN class_members cm ON u.id = cm.user_id
             WHERE cm.class_id = ? AND cm.user_id != ? -- Lấy member và loại trừ teacher
             ORDER BY u.email ASC`, 
            [classId, classInfo.teacher_id] 
        );

        res.json(members);

    } catch (error) {
        console.error("Get Class Members Error:", error);
        res.status(500).json({ message: 'Error fetching class members' });
    }
};

exports.getClassCourseCompletions = async (req, res) => {
  const classId = parseInt(req.params.classId);
  const courseId = parseInt(req.params.courseId);

  if (isNaN(classId) || isNaN(courseId)) {
    return res.status(400).json({ message: 'Invalid Class ID or Course ID format' });
  }

  
  
  

  try {
    
    
    const sql = `
      SELECT
          ulc.lesson_id,
          ulc.user_id
      FROM
          user_lesson_completions ulc
      INNER JOIN
          lessons l ON ulc.lesson_id = l.id
      INNER JOIN
          class_members cm ON ulc.user_id = cm.user_id
      WHERE
          l.course_id = ? AND cm.class_id = ?;
    `;

    const [completionRecords] = await pool.execute(sql, [courseId, classId]);

    
    const completionsByLesson = completionRecords.reduce((acc, record) => {
      const { lesson_id, user_id } = record;
      if (!acc[lesson_id]) {
        acc[lesson_id] = [];
      }
      
      if (!acc[lesson_id].includes(user_id)) {
         acc[lesson_id].push(user_id);
      }
      return acc;
    }, {});

    
    res.json({ completions: completionsByLesson });

  } catch (error) {
    console.error(`Error fetching class course completions for class ${classId}, course ${courseId}:`, error);
    res.status(500).json({ message: 'Server error fetching completion data' });
  }
};