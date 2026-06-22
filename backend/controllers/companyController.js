const Company = require('../models/Company');
const User = require('../models/User');

exports.getMyProfile = async (req, res) => {
  const company = await Company.findOne({ user: req.user._id }).populate('user', 'email isApproved');
  if (!company) return res.status(404).json({ success: false, message: 'Company profile not found.' });
  res.json({ success: true, data: company });
};

exports.updateProfile = async (req, res) => {
  const allowedFields = ['companyName', 'description', 'sector', 'website', 'founded',
    'employeeCount', 'hrName', 'hrEmail', 'hrPhone', 'hrDesignation', 'headquarters',
    'officeLocations', 'linkedinUrl', 'glassdoorUrl'];
  
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  
  const company = await Company.findOneAndUpdate(
    { user: req.user._id }, updates, { new: true, runValidators: true }
  ).populate('user', 'email isApproved');
  
  if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
  res.json({ success: true, message: 'Company profile updated.', data: company });
};

exports.getAllCompanies = async (req, res) => {
  const { page = 1, limit = 10, sector, search, isVerified } = req.query;
  const query = {};
  
  if (sector) query.sector = sector;
  if (isVerified !== undefined) query.isVerified = isVerified === 'true';
  if (search) query.$or = [
    { companyName: new RegExp(search, 'i') },
    { sector: new RegExp(search, 'i') }
  ];
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [companies, total] = await Promise.all([
    Company.find(query).populate('user', 'email isApproved isActive')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Company.countDocuments(query)
  ]);
  
  res.json({
    success: true, data: companies,
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
  });
};

exports.getCompanyById = async (req, res) => {
  const company = await Company.findById(req.params.id).populate('user', 'email isApproved');
  if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
  res.json({ success: true, data: company });
};

exports.verifyCompany = async (req, res) => {
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    { isVerified: true, verifiedBy: req.user._id, verifiedAt: new Date() },
    { new: true }
  );
  if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
  
  // Notify company user
  const companyUser = await User.findById(company.user);
  if (companyUser) {
    companyUser.addNotification('Your company profile has been verified!', 'success');
    await companyUser.save({ validateBeforeSave: false });
  }
  
  res.json({ success: true, message: 'Company verified successfully.', data: company });
};

exports.deleteCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
  await User.findByIdAndDelete(company.user);
  await company.deleteOne();
  res.json({ success: true, message: 'Company deleted successfully.' });
};

exports.getCompanyDashboard = async (req, res) => {
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const Student = require('../models/Student');

  const company = await Company.findOne({ user: req.user._id });
  if (!company) return res.status(404).json({ success: false, message: 'Profile not found.' });
  
  const [jobs, applications] = await Promise.all([
    Job.find({ company: company._id }),
    Application.find({ company: company._id })
      .populate('student', 'firstName lastName branch cgpa resumeUrl')
      .populate('job', 'title deadline')
      .sort({ createdAt: -1 }).limit(10)
  ]);
const latestJob = jobs.find(
  job =>
    job.status === 'active' &&
    job.isApproved
);
  
  const activeJobs = jobs.filter(
  job => job.status === 'active'
);

let recommendedStudents = [];

if (activeJobs.length > 0) {

  const students = await Student.find({
    placementStatus: 'not_placed'
  });

  const firstJob = activeJobs[0];

  recommendedStudents = students
    .map(student => {

      let score = 0;

      const studentSkills =
        student.skills?.map(
          s => s.toLowerCase()
        ) || [];

      const jobSkills =
        firstJob.requiredSkills?.map(
          s => s.toLowerCase()
        ) || [];

      const matchedSkills =
        jobSkills.filter(skill =>
          studentSkills.includes(skill)
        );

      if (matchedSkills.length === 0) {
        return null;
      }

      score +=
        (matchedSkills.length /
          jobSkills.length) * 70;

      const branchMatch =
        firstJob.eligibility?.allowedBranches?.includes('ALL') ||
        firstJob.eligibility?.allowedBranches?.includes(
          student.branch
        );

      if (branchMatch) score += 10;

      if (
        student.cgpa >=
        (firstJob.eligibility?.minCGPA || 0)
      ) {
        score += 20;
      }

      return {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        branch: student.branch,
        cgpa: student.cgpa,
        matchedSkills,
        matchPercentage: Math.round(score)
      };
    })
    .filter(student => student !== null)
    .sort(
      (a, b) =>
        b.matchPercentage -
        a.matchPercentage
    )
    .slice(0, 5);
}

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'active').length,
    totalApplications: await Application.countDocuments({ company: company._id }),
    shortlisted: await Application.countDocuments({ company: company._id, status: 'shortlisted' }),
    selected: await Application.countDocuments({ company: company._id, status: 'selected' }),
    pending: await Application.countDocuments({ company: company._id, status: { $in: ['applied', 'under_review'] } })
    
  };

  
res.json({
  success: true,
  data: {
    stats,
    recentApplications: applications,
    company,
    recommendedStudents
  }
});};
