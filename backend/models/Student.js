const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Personal Details
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  profilePicture: String,

  // Academic Details
  rollNumber: { type: String, unique: true, sparse: true },
  seatNumber: { type: String },
  branch: {
    type: String,
    enum: ['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML', 'DS', 'IOT', 'Other'],
    required: true
  },
  cgpa: { type: Number, min: 0, max: 10 },
  backlogs: { type: Number, default: 0 },
  graduationYear: Number,
  college: { type: String, default: 'Your College Name' },
  degree: { type: String, default: 'B.Tech' },
  tenthPercent: Number,
  twelfthPercent: Number,
  
  // Skills & Projects
  skills: [{ type: String, trim: true }],
  projects: [{
    title: String,
    description: String,
    techStack: [String],
    link: String,
    duration: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    fileUrl: String
  }],

  // Links
  resumeUrl: String,
  githubUrl: String,
  linkedinUrl: String,
  portfolioUrl: String,

  // Placement Status
  placementStatus: {
    type: String,
    enum: ['not_placed', 'shortlisted', 'placed'],
    default: 'not_placed'
  },
  isEligibleForPlacement: { type: Boolean, default: true },
  placedCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  packageOffered: Number,

  // Trainer assigned
  assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  
  // Readiness score (set by trainer)
  readinessScore: { type: Number, min: 0, max: 100, default: 0 },
  trainerFeedback: [{
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    feedback: String,
    date: { type: Date, default: Date.now },
    category: { type: String, enum: ['resume', 'technical', 'communication', 'overall'] }
  }]
}, { timestamps: true });

studentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.index({ branch: 1, cgpa: -1 });
studentSchema.index({ skills: 1 });
studentSchema.index({ placementStatus: 1 });

module.exports = mongoose.model('Student', studentSchema);
