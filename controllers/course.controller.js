const pool = require("../config/db");

exports.getAllCourses = async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; 
  const offset = (page - 1) * limit;

  try {
    
    const [courses] = await pool.execute(
      "SELECT id, title, description, img_url FROM courses",
      [limit, offset] 
    );

    
    const [[{ totalCourses }]] = await pool.execute(
      
      "SELECT COUNT(*) as totalCourses FROM courses"
    );

    const totalPages = Math.ceil(totalCourses / limit);

    res.json({
      courses,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses,
        limit,
      },
    });
  } catch (error) {
    console.error("Get All Courses Error:", error);
    res.status(500).json({ message: "Error fetching courses" });
  }
};

exports.getCourseDetails = async (req, res) => {
  const { courseId } = req.params;
  if (isNaN(parseInt(courseId))) {
    
    return res.status(400).json({ message: "Invalid course ID" });
  }
  try {
    
    const [courseResult] = await pool.execute(
      "SELECT id, title, description, img_url FROM courses WHERE id = ?",
      [courseId]
    );

    if (courseResult.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    const course = courseResult[0];

    
    const [lessons] = await pool.execute(
      "SELECT id, title, external_url FROM lessons WHERE course_id = ?", 
      [courseId]
    );

    
    course.lessons = lessons;

    res.json(course);
  } catch (error) {
    console.error("Get Course Details Error:", error);
    res.status(500).json({ message: "Error fetching course details" });
  }
};


exports.createCourse = async (req, res) => {
  const { title, description, img_url } = req.body;

  
  if (!title) {
    return res.status(400).json({ message: "Course title is required." });
  }

  try {
    
    const [result] = await pool.execute(
      "INSERT INTO courses (title, description, img_url) VALUES (?, ?, ?)",
      [title, description || null, img_url || null] 
    );

    
    res.status(201).json({
      message: "Course created successfully",
      course: {
        id: result.insertId,
        title: title,
        description: description || null,
        img_url: img_url || null
      },
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    res.status(500).json({ message: "Server error creating course." });
  }
};
