import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { companyAPI } from '../../api';
import { StatCard, PageLoader, StatusBadge, PageHeader, EmptyState } from '../../components/common';
import {
  Briefcase,
  FileText,
  Users,
  CheckCircle,
  Plus,
  Clock,
  Github,
  Linkedin,
  Globe,
  FileDown
} from 'lucide-react';
export default function CompanyDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['company-dashboard'],
    queryFn: () => companyAPI.getDashboard().then(r => r.data.data)
  });

  if (isLoading) return <PageLoader />;
const {
  stats,
  recentApplications,
  company,
  recommendedStudents
} = data || {};
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Welcome, {company?.companyName}! 🏢
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {company?.sector} • {company?.headquarters?.city || 'Location not set'}
            {company?.isVerified && <span className="ml-2 badge badge-green">Verified</span>}
          </p>
        </div>
        <Link to="/company/jobs/post" className="btn-primary">
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {!company?.isVerified && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Verification Pending</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Your company is awaiting admin verification. You won't be able to post jobs until verified.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Total Jobs" value={stats?.totalJobs || 0} icon={Briefcase} color="blue" subtitle={`${stats?.activeJobs || 0} active`} />
        <StatCard title="Applications" value={stats?.totalApplications || 0} icon={FileText} color="orange" subtitle={`${stats?.pending || 0} pending`} />
        <StatCard title="Shortlisted" value={stats?.shortlisted || 0} icon={Users} color="purple" />
        <StatCard title="Selected" value={stats?.selected || 0} icon={CheckCircle} color="green" />
        <StatCard title="Active Jobs" value={stats?.activeJobs || 0} icon={Briefcase} color="cyan" />
        <StatCard title="Pending Review" value={stats?.pending || 0} icon={Clock} color="orange" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Recent Applications</h3>
            <Link to="/company/applications" className="text-xs text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {recentApplications?.length ? (
            <div className="space-y-3">
              {recentApplications.slice(0, 6).map(app => (
                <div key={app._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {app.student?.firstName} {app.student?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{app.student?.branch} • CGPA: {app.student?.cgpa}</p>
                    <p className="text-xs text-gray-400">{app.job?.title}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No applications yet" subtitle="Applications will appear here once students apply." />
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Application Funnel</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Applications', count: stats?.totalApplications || 0, color: 'bg-blue-500', pct: 100 },
              { label: 'Shortlisted', count: stats?.shortlisted || 0, color: 'bg-purple-500', pct: stats?.totalApplications ? Math.round((stats.shortlisted / stats.totalApplications) * 100) : 0 },
              { label: 'Selected', count: stats?.selected || 0, color: 'bg-green-500', pct: stats?.totalApplications ? Math.round((stats.selected / stats.totalApplications) * 100) : 0 },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recommended Students */}
<div className="card p-5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
      Recommended Students
    </h3>
  </div>

  {recommendedStudents?.length ? (
    <div className="space-y-3">
      {recommendedStudents.map(student => (
        <div
          key={student._id}
          className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0"
        >
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200">
              {student.firstName} {student.lastName}
            </h4>

            <p className="text-sm text-gray-500">
              {student.branch} • CGPA {student.cgpa}
            </p>

            <div className="flex gap-1 mt-2 flex-wrap">
              {student.matchedSkills?.map(skill => (
                <span
                  key={skill}
                  className=" px-3 py-1 rounded-full text-sm font-medium
      border
      bg-blue-50 text-blue-700 border-blue-200
      dark:bg-slate-800 dark:text-cyan-300 dark:border-slate-600
    "
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">

  {student.resumeUrl && (
    <a
      href={student.resumeUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-primary text-xs"
    >
      <FileDown size={12} />
      Resume
    </a>
  )}

  {student.githubUrl && (
    <a
      href={student.githubUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-primary text-xs"
    >
      <Github size={12} />
      GitHub
    </a>
  )}

  {student.linkedinUrl && (
    <a
      href={student.linkedinUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-primary text-xs"
    >
      <Linkedin size={12} />
      LinkedIn
    </a>
  )}

  {student.portfolioUrl && (
    <a
      href={student.portfolioUrl}
      target="_blank"
      rel="noreferrer"
      className="btn-primary text-xs"
    >
      <Globe size={12} />
      Portfolio
    </a>
  )}

</div>
          </div>

          <div className="text-right space-y-2">
  <p className="font-bold text-green-600">
    {student.matchPercentage}%
  </p>

  <p className="text-xs text-gray-500">
    Match
  </p>

  <Link
  to={`/company/students/${student._id}`}

    className="btn-secondary text-xs"
  >
    View Profile
  </Link>
</div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-gray-500">
      No recommended students available.
    </p>
  )}
</div>
    </div>
  );
}
