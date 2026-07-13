const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    total_marks: { type: Number, default: 100 },
    class_name: { type: String, trim: true, default: '' },
    questions: [{ question: String, options: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
