const express = require('express');
const router = express.Router();
const {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
} = require('../controllers/gradeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getAllGrades)
  .post(createGrade);

router.route('/:id')
  .get(getGradeById)
  .put(updateGrade)
  .delete(authorize('admin'), deleteGrade);

module.exports = router;
