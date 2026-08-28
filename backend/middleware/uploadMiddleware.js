const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `uploads/${folder}`);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${folder}_${uuidv4()}${ext}`);
  }
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const allowed = allowedTypes.includes(file.mimetype);
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

exports.uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter: fileFilter([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
});

exports.uploadCertificate = multer({
  storage: storage('certificates'),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: fileFilter(['application/pdf', 'image/jpeg', 'image/png'])
});

exports.uploadProfilePic = multer({
  storage: storage('profiles'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp'])
});
