const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    // ─── Marks Breakdown ──────────────────────────────────────────────────
    marks: {
      assignment: { type: Number, default: 0, min: 0, max: 100 },
      midterm: { type: Number, default: 0, min: 0, max: 100 },
      finalExam: { type: Number, default: 0, min: 0, max: 100 },
      practical: { type: Number, default: 0, min: 0, max: 100 },
    },
    totalMarks: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'I', 'W'],
    },
    gradePoints: {
      type: Number,
      min: 0,
      max: 4.0,
    },
    semester: {
      type: String,
      required: [true, 'Semester is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// ─── Auto-calculate grade & grade points before saving ────────────────────────
gradeSchema.pre('save', function (next) {
  if (this.isModified('marks') || this.isNew) {
    const { assignment = 0, midterm = 0, finalExam = 0, practical = 0 } = this.marks;
    // Weighted average: assignment 20%, midterm 20%, final 40%, practical 20%
    const total = assignment * 0.2 + midterm * 0.2 + finalExam * 0.4 + practical * 0.2;
    this.totalMarks = Math.round(total * 100) / 100;

    // Grade assignment
    if (total >= 95) { this.grade = 'A+'; this.gradePoints = 4.0; }
    else if (total >= 90) { this.grade = 'A'; this.gradePoints = 4.0; }
    else if (total >= 85) { this.grade = 'A-'; this.gradePoints = 3.7; }
    else if (total >= 80) { this.grade = 'B+'; this.gradePoints = 3.3; }
    else if (total >= 75) { this.grade = 'B'; this.gradePoints = 3.0; }
    else if (total >= 70) { this.grade = 'B-'; this.gradePoints = 2.7; }
    else if (total >= 65) { this.grade = 'C+'; this.gradePoints = 2.3; }
    else if (total >= 60) { this.grade = 'C'; this.gradePoints = 2.0; }
    else if (total >= 55) { this.grade = 'C-'; this.gradePoints = 1.7; }
    else if (total >= 50) { this.grade = 'D'; this.gradePoints = 1.0; }
    else { this.grade = 'F'; this.gradePoints = 0.0; }
  }
  next();
});

// ─── Ensure unique grade per student per course per semester ──────────────────
gradeSchema.index({ student: 1, course: 1, semester: 1, year: 1 }, { unique: true });

const Grade = mongoose.model('Grade', gradeSchema);
module.exports = Grade;
