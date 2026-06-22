const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadResume, uploadCertificate, uploadProfilePic } = require('../middleware/uploadMiddleware');
const { 
  uploadResume: uploadResumeController,
  uploadCertificate: uploadCertController,
  uploadProfilePic: uploadPicController
} = require('../controllers/uploadController');
const path = require('path');
const fs = require('fs');
const { deleteResume } = require('../controllers/uploadController');
// Ensure upload dirs exist
['uploads/resumes', 'uploads/certificates', 'uploads/profiles'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

router.use(protect, authorize('student'));

router.post('/resume', uploadResume.single('resume'), uploadResumeController);
router.delete(
  '/resume',
  protect,
  deleteResume
);
router.post('/certificate', uploadCertificate.single('certificate'), uploadCertController);
router.post('/profile-pic', uploadProfilePic.single('profilePic'), uploadPicController);

module.exports = router;
