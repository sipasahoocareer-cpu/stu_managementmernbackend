const Contact = require('../models/Contact');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── Helper: escape regex special chars ──────────────────────────────────────
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── @desc    Submit a contact query (public)
// ─── @route   POST /api/contact
// ─── @access  Public
const submitQuery = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !name.trim()) return sendError(res, 400, 'Name is required');
    if (!message || !message.trim()) return sendError(res, 400, 'Message is required');

    const query = await Contact.create({
      name: name.trim(),
      email: email?.trim() || '',
      subject: subject?.trim() || '',
      message: message.trim(),
    });

    return sendSuccess(res, 201, 'Query submitted successfully', query);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get all contact queries (admin)
// ─── @route   GET /api/contact
// ─── @access  Private (admin)
const getAdminQueries = async (req, res) => {
  try {
    const queries = await Contact.find().sort({ submitted_at: -1 });

    // Add virtual 'id' for frontend compatibility
    const formatted = queries.map((q) => ({
      id: q._id,
      _id: q._id,
      name: q.name,
      email: q.email,
      subject: q.subject,
      message: q.message,
      status: q.status,
      submitted_at: q.submitted_at,
      resolved_at: q.resolved_at,
    }));

    return sendSuccess(res, 200, 'Queries fetched successfully', formatted);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Get contact query stats
// ─── @route   GET /api/contact/stats
// ─── @access  Private (admin)
const getQueryStats = async (req, res) => {
  try {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const resolved = await Contact.countDocuments({ status: 'resolved' });

    return sendSuccess(res, 200, 'Stats fetched', { total, pending, resolved });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Resolve / unresolve a query
// ─── @route   PATCH /api/contact/:id/resolve
// ─── @access  Private (admin)
const resolveQuery = async (req, res) => {
  try {
    const query = await Contact.findById(req.params.id);
    if (!query) return sendError(res, 404, 'Query not found');

    query.status = query.status === 'resolved' ? 'pending' : 'resolved';
    query.resolved_at = query.status === 'resolved' ? new Date() : null;
    await query.save();

    const formatted = {
      id: query._id,
      _id: query._id,
      name: query.name,
      email: query.email,
      subject: query.subject,
      message: query.message,
      status: query.status,
      submitted_at: query.submitted_at,
      resolved_at: query.resolved_at,
    };

    return sendSuccess(res, 200, `Query marked as ${query.status}`, formatted);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// ─── @desc    Delete a query
// ─── @route   DELETE /api/contact/:id
// ─── @access  Private (admin)
const deleteQuery = async (req, res) => {
  try {
    const query = await Contact.findByIdAndDelete(req.params.id);
    if (!query) return sendError(res, 404, 'Query not found');
    return sendSuccess(res, 200, 'Query deleted successfully');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  submitQuery,
  getAdminQueries,
  getQueryStats,
  resolveQuery,
  deleteQuery,
};
