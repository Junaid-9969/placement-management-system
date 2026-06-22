const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');
exports.uploadResume = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  
  const fileUrl = `/uploads/resumes/${req.file.filename}`;
  
  await Student.findOneAndUpdate({ user: req.user._id }, { resumeUrl: fileUrl });
  
  res.json({ success: true, message: 'Resume uploaded successfully.', data: { url: fileUrl, filename: req.file.filename } });
};
exports.deleteResume = async (req, res) => {
  const student = await Student.findOne({
    user: req.user._id
  });

  if (!student || !student.resumeUrl) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found'
    });
  }

  const filePath = path.join(
    __dirname,
    '..',
    student.resumeUrl
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  student.resumeUrl = null;
  await student.save();

  res.json({
    success: true,
    message: 'Resume deleted successfully'
  });
};

exports.uploadCertificate = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  
  const fileUrl = `/uploads/certificates/${req.file.filename}`;
  const { name, issuer, date } = req.body;
  
  await Student.findOneAndUpdate(
    { user: req.user._id },
    { $push: { certifications: { name, issuer, date, fileUrl } } }
  );
  
  res.json({ success: true, message: 'Certificate uploaded.', data: { url: fileUrl } });
};

exports.uploadProfilePic = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  
  const fileUrl = `/uploads/profiles/${req.file.filename}`;
  
  if (req.user.role === 'student') {
    await Student.findOneAndUpdate({ user: req.user._id }, { profilePicture: fileUrl });
  }
  
  res.json({ success: true, message: 'Profile picture uploaded.', data: { url: fileUrl } });
};
