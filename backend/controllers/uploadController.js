const Student = require('../models/Student');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

exports.uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded.'
    });
  }

  try {
    const publicId = `resumes/resume_${req.user._id}_${Date.now()}`;

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'placement-management/resumes',
          public_id: publicId.split('/').pop(),
          resource_type: 'raw'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    const fileUrl = result.secure_url;

    await Student.findOneAndUpdate(
      { user: req.user._id },
      { resumeUrl: fileUrl }
    );

    res.json({
      success: true,
      message: 'Resume uploaded successfully.',
      data: {
        url: fileUrl,
        filename: req.file.originalname
      }
    });

  } catch (error) {
    console.error('Cloudinary resume upload error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to upload resume.'
    });
  }
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

  try {
    const resumeUrl = student.resumeUrl;

    // Cloudinary resume
    if (resumeUrl.includes('res.cloudinary.com')) {
      const url = new URL(resumeUrl);

      const pathParts = url.pathname.split('/');

      // Find "upload" and remove everything before it
      const uploadIndex = pathParts.indexOf('upload');

      if (uploadIndex !== -1) {
        let publicIdParts = pathParts.slice(uploadIndex + 1);

        // Remove version e.g. v123456789
        if (publicIdParts[0]?.startsWith('v')) {
          publicIdParts.shift();
        }

        const publicId = publicIdParts.join('/');

        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw'
        });
      }
    }

    // Old local resume support
    else {
      let resumePath = resumeUrl;

      try {
        if (
          resumeUrl.startsWith('http://') ||
          resumeUrl.startsWith('https://')
        ) {
          resumePath = new URL(resumeUrl).pathname;
        }
      } catch (error) {
        console.error('Invalid old resume URL:', error);
      }

      const filePath = path.join(
        __dirname,
        '..',
        resumePath.replace(/^\/+/, '')
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    student.resumeUrl = null;
    await student.save();

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });

  } catch (error) {
    console.error('Resume deletion error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete resume.'
    });
  }
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
