
exports.isTeacher = (req, res, next) => {
    
    if (req.user && req.user.role === 'teacher') {
      next(); 
    } else {
      res.status(403).json({ message: 'Forbidden: Access denied. Teacher role required.' }); 
    }
  };
  
  
  exports.isStudent = (req, res, next) => {
    if (req.user && req.user.role === 'student') {
      next(); 
    } else {
      res.status(403).json({ message: 'Forbidden: Access denied. Student role required.' });
    }
  };