const express = require("express");
const {
  getAllCourses,
  getCourseDetails,
  createCourse,
  deleteCourse,
  updateCourse,
} = require("../controllers/course.controller");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

const checkRole = require("../middleware/checkRole");
const lessonRouter = require("./lesson.routes");

router.get("/", authenticateToken, getAllCourses);
router.get("/top", getAllCourses);
router.get("/:courseId", authenticateToken, getCourseDetails);

router.post("/", authenticateToken, checkRole("admin"), createCourse);
router.delete(
  "/:courseId",
  authenticateToken,
  checkRole("admin"),
  deleteCourse
);
router.put('/:courseId', authenticateToken, checkRole('admin'), updateCourse);

router.use("/:courseId/lessons", lessonRouter);
module.exports = router;
