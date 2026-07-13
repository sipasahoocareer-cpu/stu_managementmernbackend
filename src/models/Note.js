const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    filePath: { type: String, required: true },
    class_name: { type: String, trim: true, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacherName: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
