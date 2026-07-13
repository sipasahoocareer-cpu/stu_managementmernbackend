const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Helper: format teacher for response ──────────────────────────────────────
const formatTeacher = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  teacher_id: user.teacher_id || '',
  subject: user.subject || '',
  isActive: user.isActive,
  createdAt: user.createdAt,
});

// ─── @desc    Get all teachers (with optional search)
// ─── @route   GET /api/teachers
// ─── @access  Private (admin)
const getAllTeachers = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { role: 'teacher' };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { teacher_id: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const teachers = await User.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Teachers fetched successfully', teachers.map(formatTeacher));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get a single teacher by ID
// ─── @route   GET /api/teachers/:id
// ─── @access  Private
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) return sendError(res, 404, 'Teacher not found');
    return sendSuccess(res, 200, 'Teacher fetched successfully', formatTeacher(teacher));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Create a teacher account
// ─── @route   POST /api/teachers
// ─── @access  Private (admin)
const createTeacher = async (req, res) => {
  try {
    const { name, teacher_id, subject, password, email } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendError(res, 400, 'Name is required');
    }
    if (!teacher_id || !teacher_id.trim()) {
      return sendError(res, 400, 'Teacher ID is required');
    }

    // Check if teacher_id already exists
    const existingTID = await User.findOne({ teacher_id: teacher_id.trim().toUpperCase(), role: 'teacher' });
    if (existingTID) {
      return sendError(res, 400, `Teacher ID '${teacher_id}' is already in use`);
    }

    // Generate email from teacher_id if not provided
    const teacherEmail = email?.trim() || `${teacher_id.trim().toLowerCase()}@school.local`;

    // Check if email already exists
    const existingEmail = await User.findOne({ email: teacherEmail });
    if (existingEmail) {
      return sendError(res, 400, `Email '${teacherEmail}' is already in use`);
    }

    // Use teacher_id as default password if none provided (ensure min 6 chars)
    const rawDefaultPass = teacher_id.trim();
    const teacherPassword = password?.trim()
      ? password.trim()
      : rawDefaultPass.length >= 6
        ? rawDefaultPass
        : rawDefaultPass + '@123';

    const teacher = await User.create({
      name: name.trim(),
      email: teacherEmail,
      password: teacherPassword,
      role: 'teacher',
      teacher_id: teacher_id.trim().toUpperCase(),
      subject: subject?.trim() || '',
    });

    return sendSuccess(res, 201, 'Teacher created successfully', {
      ...formatTeacher(teacher),
      login_email: teacherEmail,
      login_password: teacherPassword, // only returned on creation
    });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 400, 'A teacher with this email or teacher ID already exists');
    }
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Update teacher
// ─── @route   PUT /api/teachers/:id
// ─── @access  Private (admin)
const updateTeacher = async (req, res) => {
  try {
    const { name, teacher_id, subject, password, isActive } = req.body;

    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' }).select('+password');
    if (!teacher) return sendError(res, 404, 'Teacher not found');

    // Check teacher_id uniqueness if changing
    if (teacher_id && teacher_id.trim().toUpperCase() !== teacher.teacher_id) {
      const existingTID = await User.findOne({
        teacher_id: teacher_id.trim().toUpperCase(),
        role: 'teacher',
        _id: { $ne: teacher._id },
      });
      if (existingTID) {
        return sendError(res, 400, `Teacher ID '${teacher_id}' is already in use`);
      }
    }

    if (name) teacher.name = name.trim();
    if (teacher_id) teacher.teacher_id = teacher_id.trim().toUpperCase();
    if (subject !== undefined) teacher.subject = subject.trim();
    if (password && password.trim()) teacher.password = password.trim();
    if (typeof isActive === 'boolean') teacher.isActive = isActive;

    await teacher.save();

    return sendSuccess(res, 200, 'Teacher updated successfully', formatTeacher(teacher));
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Delete teacher
// ─── @route   DELETE /api/teachers/:id
// ─── @access  Private (admin)
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
    if (!teacher) return sendError(res, 404, 'Teacher not found');

    await User.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, 'Teacher deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
