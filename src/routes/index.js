const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const studentRoutes = require('./studentRoutes');
const teacherRoutes = require('./teacherRoutes');
const contactRoutes = require('./contactRoutes');
const courseRoutes = require('./courseRoutes');
const gradeRoutes = require('./gradeRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const academicRoutes = require('./academicRoutes');

// ─── Mount Routes ─────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/contact', contactRoutes);
router.use('/courses', courseRoutes);
router.use('/grades', gradeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', academicRoutes);

module.exports = router;
