




const checkRole = (allowedRoles) => {
    
    return (req, res, next) => {
      
      if (!req.user || !req.user.role) {
        console.error('checkRole Middleware Error: req.user or req.user.role is missing. Ensure authMiddleware runs first and JWT payload includes role.');
        
        return res.status(403).json({ message: 'Forbidden: Role information missing.' });
        
      }
  
      const userRole = req.user.role; 
  
      
      const rolesToCheck = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
      
      if (!rolesToCheck.includes(userRole)) {
        console.warn(`Forbidden access attempt: User role "${userRole}" is not in allowed roles [${rolesToCheck.join(', ')}] for route ${req.originalUrl}`);
        
        return res.status(403).json({ message: `Forbidden: Access denied. Required role(s): ${rolesToCheck.join(' or ')}.` });
        
      }
  
      
      next();
    };
  };
  
  module.exports = checkRole; 