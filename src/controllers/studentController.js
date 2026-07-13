const Student = require('../models/Student');
const Grade = require('../models/Grade');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

// ─── @desc    Get all students (with pagination, search, filter)
// ─── @route   GET /api/students
// ─── @access  Private
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status, year } = req.query;

    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (year) filter.year = Number(year);
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const { skip, limitNum, pagination } = await getPagination(
      Student,
      filter,
      Number(page),
      Number(limit)
    );

    const students = await Student.find(filter)
      .populate('courses', 'name courseCode credits')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select('-__v');

    return sendSuccess(res, 200, 'Students fetched successfully', students, pagination);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get a single student by ID
// ─── @route   GET /api/students/:id
// ─── @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('courses', 'name courseCode credits department')
      .populate('createdBy', 'name email');

    if (!student) return sendError(res, 404, 'Student not found');

    return sendSuccess(res, 200, 'Student fetched successfully', student);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Create a new student
// ─── @route   POST /api/students
// ─── @access  Private
const createStudent = async (req, res) => {
  try {
    const studentData = {
      ...req.body,
      createdBy: req.user._id,
    };

    if (!studentData.firstName && studentData.name) {
      const parts = String(studentData.name).trim().split(/\s+/);
      studentData.firstName = parts[0] || studentData.name;
      studentData.lastName = parts.slice(1).join(' ') || 'Student';
    }

    if (!studentData.email) {
      const baseName = (studentData.firstName || studentData.name || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '');
      studentData.email = `${baseName}@school.local`;
    }

    if (!studentData.department) {
      studentData.department = studentData.class_name || 'General';
    }

    if (!studentData.year) {
      studentData.year = 1;
    }

    if (!studentData.semester) {
      studentData.semester = 1;
    }

    if (studentData.class_name) {
      studentData.class_name = String(studentData.class_name).trim();
      if (!studentData.department) {
        studentData.department = studentData.class_name;
      }
    }

    if (!studentData.password) {
      studentData.password = 'Student@1234';
    }

    if (req.file) {
      studentData.avatar = `/uploads/${req.file.filename}`;
    }

    const student = await Student.create(studentData);
    await student.populate('courses', 'name courseCode');

    return sendSuccess(res, 201, 'Student created successfully', student);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'Student with this email already exists');
    }
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Update student
// ─── @route   PUT /api/students/:id
// ─── @access  Private
const updateStudent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('courses', 'name courseCode credits');

    if (!student) return sendError(res, 404, 'Student not found');

    return sendSuccess(res, 200, 'Student updated successfully', student);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Delete student
// ─── @route   DELETE /api/students/:id
// ─── @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return sendError(res, 404, 'Student not found');

    // Also delete related grades
    await Grade.deleteMany({ student: req.params.id });
    await Student.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, 'Student and related records deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get grades of a specific student
// ─── @route   GET /api/students/:id/grades
// ─── @access  Private
const getStudentGrades = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return sendError(res, 404, 'Student not found');

    const grades = await Grade.find({ student: req.params.id })
      .populate('course', 'name courseCode credits')
      .populate('gradedBy', 'name')
      .sort({ year: -1, semester: -1 });

    // Calculate GPA
    const validGrades = grades.filter((g) => g.gradePoints !== undefined);
    const gpa =
      validGrades.length > 0
        ? (validGrades.reduce((sum, g) => sum + g.gradePoints, 0) / validGrades.length).toFixed(2)
        : 0;

    return sendSuccess(res, 200, 'Student grades fetched', { student: student.fullName, grades, gpa });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Enroll student in a course
// ─── @route   POST /api/students/:id/enroll
// ─── @access  Private
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return sendError(res, 404, 'Student not found');

    if (student.courses.includes(courseId)) {
      return sendError(res, 400, 'Student is already enrolled in this course');
    }

    student.courses.push(courseId);
    await student.save();
    await student.populate('courses', 'name courseCode credits');

    return sendSuccess(res, 200, 'Student enrolled in course successfully', student);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentGrades,
  enrollCourse,
};
