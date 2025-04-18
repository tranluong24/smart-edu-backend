const pool = require("../config/db");


exports.getStudentInfo = async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  if (isNaN(studentId)) {
    return res.status(400).json({ message: "Invalid student ID" });
  }

  
  
  

  try {
    
    const [students] = await pool.execute(
      'SELECT id, email, username, role FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(students[0]); 
  } catch (error) {
    console.error("Get Student Info Error:", error);
    res.status(500).json({ message: "Error fetching student information" });
  }
};