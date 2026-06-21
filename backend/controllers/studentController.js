const Student = require('../models/Student');
const User = require('../models/User');
const Application = require('../models/Application');
const Trainer = require('../models/Trainer');
/**
 * @swagger
 * /api/students/profile:
 *   get:
 *     tags: [Students]
 *     summary: Get own student profile
 */
exports.getMyProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'email isApproved createdAt')
    .populate('assignedTrainer', 'firstName lastName email')
    .populate('placedCompany', 'companyName');
  
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found.' });
  }
  
  res.json({ success: true, data: student });
};

/**
 * @swagger
 * /api/students/profile:
 *   put:
 *     tags: [Students]
 *     summary: Update student profile
 */
exports.updateProfile = async (req, res) => {
  const allowedFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'address',
    'rollNumber', 'seatNumber', 'cgpa', 'backlogs', 'graduationYear', 'college',
    'tenthPercent', 'twelfthPercent', 'skills', 'projects', 'githubUrl',
    'linkedinUrl', 'portfolioUrl', 'branch'
  ];
  
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  
  const student = await Student.findOneAndUpdate(
    { user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('user', 'email isApproved');
  
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student profile not found.' });
  }
  
  res.json({ success: true, message: 'Profile updated successfully.', data: student });
};

/**
 * @swagger
 * /api/students:
 *   get:
 *     tags: [Students]
 *     summary: Get all students (Admin/Trainer)
 */
exports.getAllStudents = async (req, res) => {
  const { page = 1, limit = 10, branch, placementStatus, search, minCGPA, maxCGPA } = req.query;
  
  const query = {};
  
  if (branch) query.branch = branch;
  if (placementStatus) query.placementStatus = placementStatus;
  if (minCGPA || maxCGPA) {
    query.cgpa = {};
    if (minCGPA) query.cgpa.$gte = parseFloat(minCGPA);
    if (maxCGPA) query.cgpa.$lte = parseFloat(maxCGPA);
  }
  if (search) {
    query.$or = [
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { rollNumber: new RegExp(search, 'i') }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [students, total] = await Promise.all([
    Student.find(query)
      .populate('user', 'email isApproved isActive')
      .populate('assignedTrainer', 'firstName lastName')
      .select('-trainerFeedback')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Student.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: students,
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
  });
};

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student by ID
 */
exports.getStudentById = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', 'email isApproved')
    .populate('assignedTrainer', 'firstName lastName email designation');
  
  if (!student) {
    return res.status(404).json({ success: false, message: 'Student not found.' });
  }
  
  res.json({ success: true, data: student });
};

/**
 * @swagger
 * /api/students/{id}:
 *   delete:
 *     tags: [Students]
 *     summary: Delete student (Admin only)
 */
exports.deleteStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found.'
    });
  }

  // Remove from trainer
  if (student.assignedTrainer) {
    await Trainer.findByIdAndUpdate(
      student.assignedTrainer,
      {
        $pull: {
          assignedStudents: student._id
        }
      }
    );
  }

  // Delete all applications
  await Application.deleteMany({
    student: student._id
  });

  // Delete user account
  await User.findByIdAndDelete(student.user);

  // Delete student profile
  await student.deleteOne();

  res.json({
    success: true,
    message: 'Student deleted successfully.'
  });
};

/**
 * @swagger
 * /api/students/dashboard:
 *   get:
 *     tags: [Students]
 *     summary: Student dashboard data
 */
exports.getStudentDashboard = async (req, res) => {
  const Application = require('../models/Application');
  const Job = require('../models/Job');

  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found.'
    });
  }

  const [applications, recentApplications] = await Promise.all([
    Application.find({ student: student._id }),
    Application.find({ student: student._id })
      .populate('job', 'title deadline')
      .populate('company', 'companyName logo')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const appliedJobIds = applications.map(app => app.job);

  const availableJobs = await Job.find({
    status: 'active',
    isApproved: true,
    deadline: { $gte: new Date() },
    _id: { $nin: appliedJobIds }
  })
    .populate('company', 'companyName logo')
    .limit(50);

  const recommendedJobs = availableJobs
    .map(job => {
      let score = 0;

      const studentSkills =
        student.skills?.map(skill => skill.toLowerCase()) || [];

      const jobSkills =
        job.requiredSkills?.map(skill => skill.toLowerCase()) || [];

      const matchedSkills = jobSkills.filter(skill =>
        studentSkills.includes(skill)
      );
      if (matchedSkills.length === 0) {
  return null;
}

      const skillMatch =
        jobSkills.length > 0
          ? (matchedSkills.length / jobSkills.length) * 70
          : 0;

      score += skillMatch;

      const branchEligible =
        job.eligibility?.allowedBranches?.includes('ALL') ||
        job.eligibility?.allowedBranches?.includes(student.branch);

      if (branchEligible) score += 10;

      if (
        student.cgpa >=
        (job.eligibility?.minCGPA || 0)
      ) {
        score += 20;
      }

      return {
        _id: job._id,
        title: job.title,
        location: job.location,
        company: job.company,
        matchPercentage: Math.round(score),
        matchedSkills
      };
    })
    .filter(job => job !== null)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);

  const activeJobs = availableJobs.length;

  const stats = {
    totalApplications: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    selected: applications.filter(a => a.status === 'selected').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    interviewScheduled: applications.filter(
      a => a.status === 'interview_scheduled'
    ).length,
    activeJobs,
    profileCompleteness: calculateProfileCompleteness(student),
    readinessScore: student.readinessScore
  };

  res.json({
    success: true,
    data: {
      stats,
      recentApplications,
      student,
      recommendedJobs
    }
  });
};
function calculateProfileCompleteness(student) {
  const fields = ['phone', 'cgpa', 'skills', 'resumeUrl', 'githubUrl', 'linkedinUrl', 'projects'];
  const filled = fields.filter(f => {
    const val = student[f];
    return val && (Array.isArray(val) ? val.length > 0 : true);
  });
  return Math.round((filled.length / fields.length) * 100);
}
exports.getRecommendedStudentsForJob = async (req, res) => {
  const Job = require('../models/Job');
  const Company = require('../models/Company');

  const company = await Company.findOne({
    user: req.user._id
  });

  if (!company) {
    return res.status(404).json({
      success: false,
      message: 'Company not found'
    });
  }

  const job = await Job.findById(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  const students = await Student.find({
    placementStatus: 'not_placed'
  });

  const recommendations = students
    .map(student => {

      let score = 0;

      const studentSkills =
        student.skills?.map(s => s.toLowerCase()) || [];

      const jobSkills =
        job.requiredSkills?.map(s => s.toLowerCase()) || [];

      const matchedSkills =
        jobSkills.filter(skill =>
          studentSkills.includes(skill)
        );

      if (jobSkills.length > 0) {
        score +=
          (matchedSkills.length /
            jobSkills.length) * 70;
      }

      const branchMatch =
        job.eligibility?.allowedBranches?.includes('ALL') ||
        job.eligibility?.allowedBranches?.includes(student.branch);

      if (branchMatch) score += 10;

      if (
        student.cgpa >=
        (job.eligibility?.minCGPA || 0)
      ) {
        score += 20;
      }

      return {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        branch: student.branch,
        cgpa: student.cgpa,
        skills: student.skills,
          resumeUrl: student.resumeUrl,
  githubUrl: student.githubUrl,
  linkedinUrl: student.linkedinUrl,
  portfolioUrl: student.portfolioUrl,

        matchedSkills,
        matchPercentage: Math.round(score)
      };
    })
.filter(student => student.matchedSkills.length > 0)    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 20);

  res.json({
    success: true,
    data: recommendations
  });
};