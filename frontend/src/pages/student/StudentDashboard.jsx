import { useAuth } from '../../context/AuthContext';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../api';
import { StatCard, PageLoader, StatusBadge, PageHeader, EmptyState } from '../../components/common';
import { Briefcase, FileText, CheckCircle, XCircle, Clock, TrendingUp, User, ChevronRight } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();

const { data, isLoading } = useQuery({
  queryKey: ['student-dashboard', user?._id],
  queryFn: () => studentAPI.getDashboard().then(r => r.data.data),
  enabled: !!user
});

  if (isLoading) return <PageLoader />;
const {
  stats,
  recentApplications,
  student,
  recommendedJobs
} = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Welcome back, {student?.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {student?.branch} • CGPA: {student?.cgpa || 'Not set'} • {student?.college || 'Your College'}
          </p>
        </div>
        <Link to="/student/jobs" className="btn-primary">
          <Briefcase size={16} /> Browse Jobs
        </Link>
      </div>

      {/* Profile completeness */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User size={16} className="text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile Completeness</span>
          </div>
          <span className="text-sm font-bold text-primary-600">{stats?.profileCompleteness || 0}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${stats?.profileCompleteness || 0}%` }} />
        </div>
        {stats?.profileCompleteness < 100 && (
          <Link to="/student/profile" className="text-xs text-primary-600 hover:text-primary-700 mt-2 inline-flex items-center gap-1">
            Complete your profile <ChevronRight size={12} />
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon={Briefcase} color="blue" subtitle="Available now" />
        <StatCard title="Applications" value={stats?.totalApplications || 0} icon={FileText} color="orange" />
        <StatCard title="Shortlisted" value={stats?.shortlisted || 0} icon={TrendingUp} color="purple" />
        <StatCard title="Selected" value={stats?.selected || 0} icon={CheckCircle} color="green" />
      </div>

      {/* Placement status banner */}
      {student?.placementStatus === 'placed' && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} />
            <div>
              <p className="font-bold">🎉 Congratulations! You've been placed!</p>
              <p className="text-sm text-white/80 mt-0.5">Package: ₹{student.packageOffered?.toLocaleString('en-IN') || 'N/A'} LPA</p>
            </div>
          </div>
        </div>
      )}

      {/* Application summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Application Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Applied', count: stats?.applied || 0, color: 'bg-blue-500' },
              { label: 'Under Review', count: stats?.interviewScheduled || 0, color: 'bg-yellow-500' },
              { label: 'Shortlisted', count: stats?.shortlisted || 0, color: 'bg-purple-500' },
              { label: 'Selected', count: stats?.selected || 0, color: 'bg-green-500' },
              { label: 'Rejected', count: stats?.rejected || 0, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`} />
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Applications</h3>
            <Link to="/student/applications" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-3">
            {recentApplications?.length ? recentApplications.map(app => (
              <div key={app._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{app.job?.title}</p>
                  <p className="text-xs text-gray-400">{app.company?.companyName}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            )) : (
              <EmptyState icon={FileText} title="No applications yet" subtitle="Start applying for jobs!" />
            )}
          </div>
        </div>
        {/* Recommended Jobs */}
{recommendedJobs?.length > 0 && (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-200">
        Recommended Jobs For You
      </h3>
      <Link
        to="/student/jobs"
        className="text-xs text-primary-600 hover:text-primary-700"
      >
        View All
      </Link>
    </div>

    <div className="space-y-3">
      {recommendedJobs.map(job => (
        <div
          key={job._id}
          className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0"
        >
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              {job.title}
            </h4>

            <p className="text-sm text-gray-500">
              {job.company?.companyName}
            </p>

            <p className="text-xs text-primary-600 mt-1">
  Match Score: {job.matchPercentage}%
</p>
<div className="flex flex-wrap gap-1 mt-2">
  {job.matchedSkills?.slice(0, 3).map((skill, index) => (
    <span
      key={index}
      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
    >
      {skill}
    </span>
  ))}
</div>
          </div>

          <Link
            to={`/student/jobs/${job._id}`}
            className="btn-secondary text-sm"
          >
            View Job
          </Link>
        </div>
      ))}
    </div>
  </div>
)}
      </div>

      {/* Trainer feedback */}
      {student?.trainerFeedback?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Latest Trainer Feedback</h3>
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">T</div>
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{student.trainerFeedback[0].feedback}</p>
              <p className="text-xs text-gray-400 mt-1 capitalize">{student.trainerFeedback[0].category} • {new Date(student.trainerFeedback[0].date).toLocaleDateString()}</p>
            </div>
          </div>
          {student?.readinessScore > 0 && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Placement Readiness</span>
                <span className="text-xs font-bold text-primary-600">{student.readinessScore}/100</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${student.readinessScore >= 70 ? 'bg-green-500' : student.readinessScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${student.readinessScore}%` }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
