const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentGrades,
  enrollCourse,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getAllStudents)
  .post(upload.single('avatar'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(upload.single('avatar'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

router.get('/:id/grades', getStudentGrades);
router.post('/:id/enroll', enrollCourse);

module.exports = router;
