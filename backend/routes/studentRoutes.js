const express = require('express');
const router = express.Router();
const { protect, authorize, requireApproval } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  updateProfile,
  getAllStudents,
  getStudentById,
  deleteStudent,
  getStudentDashboard,
  getRecommendedStudentsForJob
} = require('../controllers/studentController');

router.use(protect);

// Student's own routes
router.get('/profile', authorize('student'), requireApproval, getMyProfile);
router.put('/profile', authorize('student'), requireApproval, updateProfile);
router.get('/dashboard', authorize('student'), requireApproval, getStudentDashboard);
router.get(
  '/recommended/:jobId',
  protect,
  authorize('company'),
  getRecommendedStudentsForJob
);

// Admin/Trainer routes
router.get('/', authorize('admin', 'trainer', 'company'), getAllStudents);
router.get('/:id', authorize('admin', 'trainer', 'company'), getStudentById);
router.delete('/:id', authorize('admin'), deleteStudent);

module.exports = router;
