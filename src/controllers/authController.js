const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── @desc    Register a new admin/teacher
// ─── @route   POST /api/auth/register
// ─── @access  Public (first user) / Admin only
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'User with this email already exists');
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id);

    return sendSuccess(res, 201, 'User registered successfully', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        class_name: user.class_name,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = async (req, res) => {
  try {
    const identifier = req.body.name || req.body.identifier || '';
    const password = req.body.password || '';

    if (!identifier || !password) {
      return sendError(res, 400, 'Name or email and password are required');
    }

    const user = await User.findOne({
      $or: [{ name: identifier }, { email: identifier }],
    }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid name or password');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account has been deactivated. Contact admin.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid name or password');
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Login successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        class_name: user.class_name,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get currently logged-in user
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User profile fetched', user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Update profile
// ─── @route   PUT /api/auth/me
// ─── @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Change password
// ─── @route   PUT /api/auth/change-password
// ─── @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 400, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
