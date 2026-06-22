import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { studentAPI, uploadAPI } from '../../api';
import { PageHeader, PageLoader, FormField } from '../../components/common';
import { Save, Upload, Github, Linkedin, Globe, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const branches = ['CSE','IT','ECE','EEE','ME','CE','AIDS','AIML','DS','IOT','Other'];

export default function StudentProfile() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentAPI.getProfile().then(r => r.data.data)
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = useForm();
  const skills = watch('skills', []);

  useEffect(() => {
    if (profileData) {
      reset({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || '',
        college: profileData.college || '',
        branch: profileData.branch || '',
        cgpa: profileData.cgpa || '',
        rollNumber: profileData.rollNumber || '',
        seatNumber: profileData.seatNumber || '',
        backlogs: profileData.backlogs || 0,
        graduationYear: profileData.graduationYear || '',
        tenthPercent: profileData.tenthPercent || '',
        twelfthPercent: profileData.twelfthPercent || '',
        githubUrl: profileData.githubUrl || '',
        linkedinUrl: profileData.linkedinUrl || '',
        portfolioUrl: profileData.portfolioUrl || '',
        skills: profileData.skills || []
      });
    }
  }, [profileData, reset]);

  const updateMutation = useMutation({
    mutationFn: studentAPI.updateProfile,
    onSuccess: () => { toast.success('Profile updated!'); qc.invalidateQueries(['student-profile']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });
  const deleteResumeMutation = useMutation({
  mutationFn: uploadAPI.deleteResume,

  onSuccess: () => {
    toast.success('Resume deleted');
    qc.invalidateQueries(['student-profile']);
  },

  onError: () => {
    toast.error('Failed to delete resume');
  }
});

  const handleResumeUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('File too large. Max 5MB.');
    return;
  }

  const formData = new FormData();
  formData.append('resume', file);

  setUploading(true);

  try {
    const res = await uploadAPI.uploadResume(formData);

    toast.success('Resume uploaded!');

    console.log("Upload Response:", res.data);

    // ✅ IMPORTANT FIX: refresh BOTH places where resume is used
    await qc.invalidateQueries({ queryKey: ['student-profile'] });

    await qc.invalidateQueries({ queryKey: ['student-dashboard'] });

  } catch (err) {
    console.error(err);
    toast.error('Upload failed');
  } finally {
    setUploading(false);
  }
};
  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !skills.includes(skill)) {
      setValue('skills', [...skills, skill], { shouldDirty: true });
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setValue('skills', skills.filter(sk => sk !== s), { shouldDirty: true });

  const onSubmit = (data) => updateMutation.mutate(data);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Manage your personal and academic information" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <input {...register('firstName', { required: 'Required' })} className="input" />
            </FormField>
            <FormField label="Last Name" required>
              <input {...register('lastName', { required: 'Required' })} className="input" />
            </FormField>
            <FormField label="Phone">
              <input {...register('phone')} className="input" placeholder="10-digit mobile" />
            </FormField>
          </div>
        </div>

        {/* Academic Info */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Academic Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField label="Roll Number">
              <input {...register('rollNumber')} className="input" placeholder="CS2024001" />
            </FormField>
            <FormField label="Seat Number">
              <input {...register('seatNumber')} className="input" />
            </FormField>
            <FormField label="Branch" required>
              <select {...register('branch', { required: 'Required' })} className="input">
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FormField>
            <FormField label="CGPA">
              <input {...register('cgpa')} type="number" step="0.01" min="0" max="10" className="input" />
            </FormField>
            <FormField label="Backlogs">
              <input {...register('backlogs')} type="number" min="0" className="input" />
            </FormField>
            <FormField label="Graduation Year">
              <input {...register('graduationYear')} type="number" className="input" placeholder="2025" />
            </FormField>
            <FormField label="College Name">
  <input
    {...register('college')}
    className="input"
    placeholder="Enter College Name"
  />
</FormField>
            <FormField label="10th Percentage">
              <input {...register('tenthPercent')} type="number" step="0.01" min="0" max="100" className="input" />
            </FormField>
            <FormField label="12th / Diploma %">
              <input {...register('twelfthPercent')} type="number" step="0.01" min="0" max="100" className="input" />
            </FormField>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Skills</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              className="input flex-1"
              placeholder="Type a skill and press Enter or Add"
            />
            <button type="button" onClick={addSkill} className="btn-primary px-4">
              <Plus size={16} /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="badge badge-blue flex items-center gap-1.5 py-1 px-3">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
            {skills.length === 0 && <p className="text-sm text-gray-400">No skills added yet</p>}
          </div>
        </div>

        {/* Links */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Links & Portfolio</h2>
          <div className="grid gap-4">
            <FormField label="GitHub URL">
              <div className="relative">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('githubUrl')} className="input pl-9" placeholder="https://github.com/username" />
              </div>
            </FormField>
            <FormField label="LinkedIn URL">
              <div className="relative">
                <Linkedin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('linkedinUrl')} className="input pl-9" placeholder="https://linkedin.com/in/username" />
              </div>
            </FormField>
            <FormField label="Portfolio / Website">
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input {...register('portfolioUrl')} className="input pl-9" placeholder="https://yourportfolio.com" />
              </div>
            </FormField>
          </div>
        </div>

        {/* Resume Upload */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Resume</h2>
          {profileData?.resumeUrl && (
  <div className="flex items-center justify-between mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
    
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
        <Upload size={16} className="text-green-600" />
      </div>

      <div>
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Resume uploaded
        </p>

        <a
          href={profileData.resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-green-600 hover:underline"
        >
          View Resume
        </a>
      </div>
    </div>

    <button
      type="button"
      onClick={() => {
        if (window.confirm('Delete this resume?')) {
          deleteResumeMutation.mutate();
        }
      }}
      className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
    >
      Delete
    </button>

  </div>
)}
          <label className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
              <Upload size={24} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploading ? 'Uploading...' : 'Click to upload resume (PDF, DOC, DOCX)'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
            </div>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={updateMutation.isPending || !isDirty} className="btn-primary px-6 py-2.5">
            {updateMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
