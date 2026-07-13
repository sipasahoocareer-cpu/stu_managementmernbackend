const Student = require('../models/Student');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─── @desc    Get dashboard statistics
// ─── @route   GET /api/dashboard/stats
// ─── @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Parallel DB queries for efficiency
    const [
      totalStudents,
      activeStudents,
      totalCourses,
      activeCourses,
      totalGrades,
      totalUsers,
      recentStudents,
      departmentStats,
      gradeDistribution,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'active' }),
      Grade.countDocuments(),
      User.countDocuments(),

      // Recent 5 students
      Student.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName email department year status createdAt'),

      // Students grouped by department
      Student.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Grade distribution (A, B, C, D, F)
      Grade.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $in: ['$grade', ['A+', 'A', 'A-']] }, then: 'A' },
                  { case: { $in: ['$grade', ['B+', 'B', 'B-']] }, then: 'B' },
                  { case: { $in: ['$grade', ['C+', 'C', 'C-']] }, then: 'C' },
                  { case: { $eq: ['$grade', 'D'] }, then: 'D' },
                  { case: { $eq: ['$grade', 'F'] }, then: 'F' },
                ],
                default: 'Other',
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const stats = {
      overview: {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        totalCourses,
        activeCourses,
        totalGrades,
        totalUsers,
      },
      recentStudents,
      departmentStats: departmentStats.map((d) => ({
        department: d._id || 'Unknown',
        count: d.count,
      })),
      gradeDistribution: gradeDistribution.map((g) => ({
        grade: g._id,
        count: g.count,
      })),
    };

    return sendSuccess(res, 200, 'Dashboard stats fetched', stats);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { getDashboardStats };
