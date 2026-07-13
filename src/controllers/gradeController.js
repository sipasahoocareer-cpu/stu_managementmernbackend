const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

// ─── @desc    Get all grades
// ─── @route   GET /api/grades
// ─── @access  Private
const getAllGrades = async (req, res) => {
  try {
    const { page = 1, limit = 10, semester, year, studentId, courseId } = req.query;

    const filter = {};
    if (semester) filter.semester = semester;
    if (year) filter.year = Number(year);
    if (studentId) filter.student = studentId;
    if (courseId) filter.course = courseId;

    const { skip, limitNum, pagination } = await getPagination(
      Grade,
      filter,
      Number(page),
      Number(limit)
    );

    const grades = await Grade.find(filter)
      .populate('student', 'firstName lastName studentId email')
      .populate('course', 'name courseCode credits')
      .populate('gradedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return sendSuccess(res, 200, 'Grades fetched successfully', grades, pagination);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get single grade
// ─── @route   GET /api/grades/:id
// ─── @access  Private
const getGradeById = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'firstName lastName studentId email')
      .populate('course', 'name courseCode credits')
      .populate('gradedBy', 'name');

    if (!grade) return sendError(res, 404, 'Grade not found');
    return sendSuccess(res, 200, 'Grade fetched successfully', grade);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Add/create grade
// ─── @route   POST /api/grades
// ─── @access  Private
const createGrade = async (req, res) => {
  try {
    const { student, course } = req.body;

    // Validate student & course exist
    const [studentDoc, courseDoc] = await Promise.all([
      Student.findById(student),
      Course.findById(course),
    ]);
    if (!studentDoc) return sendError(res, 404, 'Student not found');
    if (!courseDoc) return sendError(res, 404, 'Course not found');

    // Verify student is enrolled in the course
    if (!studentDoc.courses.includes(course)) {
      return sendError(res, 400, 'Student is not enrolled in this course');
    }

    const grade = await Grade.create({ ...req.body, gradedBy: req.user._id });
    await grade.populate([
      { path: 'student', select: 'firstName lastName studentId' },
      { path: 'course', select: 'name courseCode' },
    ]);

    return sendSuccess(res, 201, 'Grade added successfully', grade);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Grade already exists for this student, course, and semester. Use update instead.');
    }
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Update grade
// ─── @route   PUT /api/grades/:id
// ─── @access  Private
const updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      { ...req.body, gradedBy: req.user._id },
      { new: true, runValidators: true }
    )
      .populate('student', 'firstName lastName studentId')
      .populate('course', 'name courseCode');

    if (!grade) return sendError(res, 404, 'Grade not found');
    return sendSuccess(res, 200, 'Grade updated successfully', grade);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Delete grade
// ─── @route   DELETE /api/grades/:id
// ─── @access  Private (Admin)
const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return sendError(res, 404, 'Grade not found');
    return sendSuccess(res, 200, 'Grade deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getAllGrades, getGradeById, createGrade, updateGrade, deleteGrade };
