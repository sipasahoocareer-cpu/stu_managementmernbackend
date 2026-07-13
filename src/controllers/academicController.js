const fs = require('fs');
const path = require('path');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const normalizeClassName = (value) => {
  if (!value) return '';
  return String(value).trim();
};

const getStudentClassName = async (user) => {
  if (!user) return '';
  if (user.class_name) return normalizeClassName(user.class_name);
  const student = await Student.findOne({ email: user.email }).lean();
  return student?.class_name || student?.department || '';
};

const createNote = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, 'PDF file is required');
    if (!req.user || !['teacher', 'admin'].includes(req.user.role)) {
      return sendError(res, 403, 'Only teachers and admins can upload notes');
    }

    const className = normalizeClassName(req.body.class_name || req.body.className || '');
    if (!className) return sendError(res, 400, 'Class is required');

    const note = await Note.create({
      title: req.body.title,
      content: req.body.content || '',
      filePath: `/uploads/notes/${req.file.filename}`,
      class_name: className,
      uploadedBy: req.user._id,
      teacherName: req.user.name,
    });

    return sendSuccess(res, 201, 'Note uploaded successfully', {
      id: note._id,
      title: note.title,
      content: note.content,
      class_name: note.class_name,
      created_at: note.createdAt,
      teacher_name: note.teacherName,
      file_url: note.filePath,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const listNotes = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      const className = await getStudentClassName(req.user);
      filter.class_name = className;
    } else if (req.user.role === 'teacher') {
      const className = normalizeClassName(req.user.class_name || '');
      if (className) filter.class_name = className;
      else filter.uploadedBy = req.user._id;
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Notes fetched successfully', notes.map((note) => ({
      id: note._id,
      title: note.title,
      content: note.content,
      class_name: note.class_name,
      created_at: note.createdAt,
      teacher_name: note.teacherName,
      file_url: note.filePath,
    })));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return sendError(res, 404, 'Note not found');
    if (req.user.role !== 'admin' && String(note.uploadedBy) !== String(req.user._id)) {
      return sendError(res, 403, 'Not authorized to delete this note');
    }

    const fullPath = path.join(__dirname, '..', 'uploads', 'notes', path.basename(note.filePath));
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    await note.deleteOne();

    return sendSuccess(res, 200, 'Note deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const getNoteFile = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return sendError(res, 404, 'Note not found');

    const filePath = path.join(__dirname, '..', 'uploads', 'notes', path.basename(note.filePath));
    if (!fs.existsSync(filePath)) return sendError(res, 404, 'File not found');

    res.download(filePath, `${note.title}.pdf`);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createQuiz = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return sendError(res, 403, 'Only teachers and admins can create quizzes');
    }

    const className = normalizeClassName(req.body.class_name || req.body.className || '');
    if (!className) return sendError(res, 400, 'Class is required');

    const quiz = await Quiz.create({
      title: req.body.title,
      description: req.body.description || '',
      total_marks: Number(req.body.total_marks || 100),
      class_name: className,
      questions: Array.isArray(req.body.questions) ? req.body.questions : [],
      createdBy: req.user._id,
    });

    return sendSuccess(res, 201, 'Quiz created successfully', {
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      total_marks: quiz.total_marks,
      class_name: quiz.class_name,
      questions: quiz.questions,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const listQuizzes = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'student') {
      const className = await getStudentClassName(req.user);
      filter.class_name = className;
    } else if (req.user.role === 'teacher') {
      const className = normalizeClassName(req.user.class_name || '');
      if (className) filter.class_name = className;
      else filter.createdBy = req.user._id;
    }

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Quizzes fetched successfully', quizzes.map((quiz) => ({
      id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      total_marks: quiz.total_marks,
      class_name: quiz.class_name,
      questions: quiz.questions,
    })));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const submitQuiz = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return sendError(res, 403, 'Only students can submit quizzes');
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return sendError(res, 404, 'Quiz not found');

    return sendSuccess(res, 200, 'Quiz submitted successfully', {
      quizId: quiz._id,
      answers: req.body.answers || {},
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const createAttendance = async (req, res) => {
  try {
    if (!['teacher', 'admin'].includes(req.user.role)) {
      return sendError(res, 403, 'Only teachers and admins can mark attendance');
    }

    const { student_id, status, date } = req.body;
    if (!student_id || !status || !date) {
      return sendError(res, 400, 'student_id, status, and date are required');
    }

    const student = await Student.findById(student_id);
    if (!student) return sendError(res, 404, 'Student not found');

    const className = normalizeClassName(req.body.class_name || req.user.class_name || student.class_name || '');

    const attendanceRecord = await Attendance.findOneAndUpdate(
      { student: student_id, date: new Date(date) },
      { status, date: new Date(date), class_name: className, markedBy: req.user._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return sendSuccess(res, 201, 'Attendance marked successfully', attendanceRecord);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

const listAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return sendError(res, 403, 'Only students can view attendance');
    }

    const student = await Student.findOne({ email: req.user.email });
    if (!student) return sendError(res, 404, 'Student profile not found');

    const records = await Attendance.find({ student: student._id }).sort({ date: 1 });
    return sendSuccess(res, 200, 'Attendance fetched successfully', records.map((record) => ({
      id: record._id,
      status: record.status,
      date: record.date,
      class_name: record.class_name,
    })));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  createNote,
  listNotes,
  deleteNote,
  getNoteFile,
  createQuiz,
  listQuizzes,
  submitQuiz,
  createAttendance,
  listAttendance,
};
