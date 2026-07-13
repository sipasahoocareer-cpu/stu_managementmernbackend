const Course = require('../models/Course');
const Student = require('../models/Student');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

// ─── @desc    Get all courses
// ─── @route   GET /api/courses
// ─── @access  Private
const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limitNum, pagination } = await getPagination(
      Course,
      filter,
      Number(page),
      Number(limit)
    );

    const courses = await Course.find(filter)
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return sendSuccess(res, 200, 'Courses fetched successfully', courses, pagination);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get single course
// ─── @route   GET /api/courses/:id
// ─── @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name email');
    if (!course) return sendError(res, 404, 'Course not found');

    // Get enrolled students count
    const enrolledCount = await Student.countDocuments({ courses: req.params.id });

    return sendSuccess(res, 200, 'Course fetched successfully', { ...course.toObject(), enrolledCount });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Create course
// ─── @route   POST /api/courses
// ─── @access  Private (Admin)
const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    return sendSuccess(res, 201, 'Course created successfully', course);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Course with this code already exists');
    }
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Update course
// ─── @route   PUT /api/courses/:id
// ─── @access  Private (Admin)
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('instructor', 'name email');

    if (!course) return sendError(res, 404, 'Course not found');
    return sendSuccess(res, 200, 'Course updated successfully', course);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Delete course
// ─── @route   DELETE /api/courses/:id
// ─── @access  Private (Admin)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return sendError(res, 404, 'Course not found');

    // Remove this course from all students
    await Student.updateMany({ courses: req.params.id }, { $pull: { courses: req.params.id } });

    return sendSuccess(res, 200, 'Course deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get students enrolled in a course
// ─── @route   GET /api/courses/:id/students
// ─── @access  Private
const getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return sendError(res, 404, 'Course not found');

    const students = await Student.find({ courses: req.params.id }).select(
      'firstName lastName email studentId department year status'
    );

    return sendSuccess(res, 200, 'Enrolled students fetched', { course: course.name, students });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse, getCourseStudents };
