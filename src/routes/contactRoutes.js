const express = require('express');
const router = express.Router();
const {
  submitQuery,
  getAdminQueries,
  getQueryStats,
  resolveQuery,
  deleteQuery,
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// ── Public: anyone can submit a query ────────────────────────────────────────
router.post('/', submitQuery);

// ── Private: admin routes ────────────────────────────────────────────────────
router.get('/stats', protect, getQueryStats);
router.get('/', protect, getAdminQueries);
router.patch('/:id/resolve', protect, resolveQuery);
router.delete('/:id', protect, deleteQuery);

module.exports = router;
