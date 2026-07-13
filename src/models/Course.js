const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [150, 'Course name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [1, 'Credits must be at least 1'],
      max: [10, 'Credits cannot exceed 10'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    schedule: {
      days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
      startTime: { type: String },
      endTime: { type: String },
      room: { type: String },
    },
    maxEnrollment: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active',
    },
    semester: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: enrolled students count ────────────────────────────────────────
courseSchema.virtual('enrolledCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'courses',
  count: true,
});

// ─── Index ────────────────────────────────────────────────────────────────────
courseSchema.index({ courseCode: 1 });
courseSchema.index({ name: 'text', department: 'text' });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
