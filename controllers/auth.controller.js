const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db"); 
const { secret, expiresIn } = require("../config/jwt");

exports.register = async (req, res) => {
  const { email, username, password, role } = req.body;
  
  if (!email || !username || !password || !role) {
    return res.status(400).json({
      message: "Email, password and username are required",
    });
  }

  if (/\s/.test(username)) {
    return res.status(400).json({ message: "Username cannot contain spaces" });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters long",
    });
  }

  if (role !== "student" && role !== "teacher") {
    return res.status(400).json({
      message: 'Invalid role specified. Must be "student" or "teacher"',
    });
  }

  try {
    
    
    const [existingUsers] = await pool.execute(
      "SELECT email FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    
    const hashedPassword = bcrypt.hashSync(password, 10);

    
    const [result] = await pool.execute(
      "INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)",
      [email, username, hashedPassword, role]
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  try {
    
    const [users] = await pool.execute(
      "SELECT id, email, username, password, role FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" }); 
    }
    const user = users[0];

    
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" }); 
    }

    
    const payload = {
      userId: user.id,
      role: user.role,
    };
    const token = jwt.sign(payload, secret, { expiresIn });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      }, 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};






exports.getCurrentUser = async (req, res) => {
  
  if (!req.user || !req.user.userId) {
    
    console.error("Get Current User Error: userId missing from req.user");
    return res.status(401).json({ message: 'Unauthorized: Missing user information in token payload.' });
  }

  const userId = req.user.userId;

  try {
    
    const [users] = await pool.execute(
      'SELECT id, email, username, role FROM users WHERE id = ? LIMIT 1',
      [userId]
    );

    if (users.length === 0) {
      
      return res.status(404).json({ message: 'User not found.' });
    }

    
    res.json({ user: users[0] });

  } catch (error) {
    console.error("Get Current User DB Error:", error);
    res.status(500).json({ message: 'Server error fetching user profile.' });
  }
};