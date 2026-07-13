const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // ─── Personal Info ─────────────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid phone number'],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    avatar: {
      type: String,
      default: null,
    },

    // ─── Academic Info ─────────────────────────────────────────────────────
    studentId: {
      type: String,
      unique: true,
      // Auto-generated in pre-save hook
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    class_name: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1, 'Year must be at least 1'],
      max: [6, 'Year cannot exceed 6'],
    },
    semester: {
      type: Number,
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated', 'suspended'],
      default: 'active',
    },

    // ─── Address ───────────────────────────────────────────────────────────
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      country: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },

    // ─── Courses enrolled ─────────────────────────────────────────────────
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],

    // ─── Metadata ─────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: full name ───────────────────────────────────────────────────────
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Virtual: name (alias for fullName) ───────────────────────────────────────
studentSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// ─── Virtual: grades (reverse-populate) ──────────────────────────────────────
studentSchema.virtual('grades', {
  ref: 'Grade',
  localField: '_id',
  foreignField: 'student',
});

// ─── Auto-generate student ID ─────────────────────────────────────────────────
studentSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await mongoose.model('Student').countDocuments();
  this.studentId = `STU${String(count + 1).padStart(5, '0')}`;
  next();
});

// ─── Index for faster searches ────────────────────────────────────────────────
studentSchema.index({ email: 1, studentId: 1 });
studentSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
