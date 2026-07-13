const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const noteUpload = require('../middleware/noteUploadMiddleware');
const {
  createNote,
  listNotes,
  deleteNote,
  getNoteFile,
  createQuiz,
  listQuizzes,
  submitQuiz,
  createAttendance,
  listAttendance,
} = require('../controllers/academicController');

router.use(protect);

router.post('/notes', noteUpload.single('file'), createNote);
router.get('/notes', listNotes);
router.delete('/notes/:id', deleteNote);
router.get('/notes/:id/file', getNoteFile);

router.post('/quiz', createQuiz);
router.get('/quiz', listQuizzes);
router.post('/quiz/:id/submit', submitQuiz);

router.post('/attendance', createAttendance);
router.get('/attendance/:studentId', listAttendance);

module.exports = router;
