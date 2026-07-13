const express = require('express');
const router = express.Router();
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All teacher routes require authentication
router.use(protect);

// GET all teachers / POST create teacher (admin only)
router.route('/')
  .get(getAllTeachers)
  .post(authorize('admin'), createTeacher);

// GET / PUT / DELETE single teacher
router.route('/:id')
  .get(getTeacherById)
  .put(authorize('admin'), updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

module.exports = router;
