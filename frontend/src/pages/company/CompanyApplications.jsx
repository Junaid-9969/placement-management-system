import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationAPI } from '../../api';
import { PageHeader, StatusBadge, Pagination, PageLoader, EmptyState, Select, Modal } from '../../components/common';
import { FileText, Eye, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlist' },
  { value: 'interview_scheduled', label: 'Schedule Interview' },
  { value: 'interview_done', label: 'Interview Done' },
  { value: 'selected', label: 'Select' },
  { value: 'rejected', label: 'Reject' }
];

export default function CompanyApplications() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', note: '', package: '', joiningDate: '', interviewDate: '', interviewTime: '', interviewMode: 'online', meetLink: '', feedback: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['company-applications', filterStatus, page],
    queryFn: () => applicationAPI.getCompanyApplications({ status: filterStatus, page, limit: 12 }).then(r => r.data)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => applicationAPI.updateStatus(id, data),
    onSuccess: () => {
      toast.success('Status updated!');
      qc.invalidateQueries(['company-applications']);
      setSelected(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  const handleUpdate = (app) => {
    setSelected(app);
    setUpdateData({ status: app.status, note: '', package: '', joiningDate: '', interviewDate: '', interviewTime: '', interviewMode: 'online', meetLink: '', feedback: '' });
  };

  const submitUpdate = () => {
    const payload = {
      status: updateData.status,
      note: updateData.note,
      companyFeedback: updateData.feedback
    };
    if (updateData.status === 'interview_scheduled') {
      payload.interviewSchedule = {
        date: updateData.interviewDate,
        time: updateData.interviewTime,
        mode: updateData.interviewMode,
        meetLink: updateData.meetLink
      };
    }
    if (updateData.status === 'selected' && updateData.package) {
      payload.offerDetails = {
        package: parseInt(updateData.package),
        joiningDate: updateData.joiningDate || undefined
      };
    }
    updateMutation.mutate({ id: selected._id, data: payload });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Applications Received" subtitle={`${data?.meta?.total || 0} total applications`} />

      <Select value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }}
        options={[{ value: 'applied', label: 'Applied' }, { value: 'under_review', label: 'Under Review' }, { value: 'shortlisted', label: 'Shortlisted' }, { value: 'interview_scheduled', label: 'Interview Scheduled' }, { value: 'selected', label: 'Selected' }, { value: 'rejected', label: 'Rejected' }]}
        placeholder="All Statuses" className="w-52" />

      {isLoading ? <PageLoader /> : (
        <>
          {!data?.data?.length ? (
            <div className="card"><EmptyState icon={FileText} title="No applications" subtitle="Applications will appear here once students apply to your jobs." /></div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Candidate</th><th>Job</th><th>Branch / CGPA</th><th>Skills</th><th>Status</th><th>Resume</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {data.data.map(app => (
                      <tr key={app._id}>
                        <td>
                          <p className="font-medium text-gray-800 dark:text-gray-200">{app.student?.firstName} {app.student?.lastName}</p>
                          <p className="text-xs text-gray-400">{app.student?.phone}</p>
                        </td>
                        <td className="text-sm text-gray-600 dark:text-gray-400">{app.job?.title}</td>
                        <td>
                          <p className="text-sm">{app.student?.branch}</p>
                          <p className="text-xs text-gray-400">CGPA: {app.student?.cgpa}</p>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {app.student?.skills?.slice(0, 2).map((s, i) => <span key={i} className="badge badge-gray">{s}</span>)}
                            {(app.student?.skills?.length || 0) > 2 && <span className="badge badge-gray">+{app.student.skills.length - 2}</span>}
                          </div>
                        </td>
                        <td><StatusBadge status={app.status} /></td>
                        <td>
                          {app.student?.resumeUrl ? (
                            <a
  href={app.student.resumeUrl}
  target="_blank"
  rel="noreferrer"
  className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-xs"
  onClick={(e) => {
    e.preventDefault();
    window.open(
      `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(app.student.resumeUrl)}`,
      '_blank'
    );
  }}
>
  <ExternalLink size={12} /> View
</a>
                          ) : <span className="text-xs text-gray-400">N/A</span>}
                        </td>
                        <td>
                          <button onClick={() => handleUpdate(app)}
                            className="btn-secondary text-xs py-1 px-2.5">
                            <Eye size={12} /> Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={data.meta?.pages || 1} onPage={setPage} />
            </>
          )}
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Update Application Status" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
              <p className="font-medium">{selected.student?.firstName} {selected.student?.lastName} → {selected.job?.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">Current: <StatusBadge status={selected.status} /></p>
            </div>

            <div>
              <label className="label">New Status</label>
              <select value={updateData.status} onChange={e => setUpdateData(prev => ({ ...prev, status: e.target.value }))} className="input">
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {updateData.status === 'interview_scheduled' && (
              <div className="space-y-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Interview Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">Date</label>
                    <input type="date" value={updateData.interviewDate} onChange={e => setUpdateData(p => ({ ...p, interviewDate: e.target.value }))} className="input text-sm" />
                  </div>
                  <div>
                    <label className="label text-xs">Time</label>
                    <input type="time" value={updateData.interviewTime} onChange={e => setUpdateData(p => ({ ...p, interviewTime: e.target.value }))} className="input text-sm" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Mode</label>
                  <select value={updateData.interviewMode} onChange={e => setUpdateData(p => ({ ...p, interviewMode: e.target.value }))} className="input text-sm">
                    <option value="online">Online</option><option value="offline">Offline</option><option value="telephonic">Telephonic</option>
                  </select>
                </div>
                {updateData.interviewMode === 'online' && (
                  <div>
                    <label className="label text-xs">Meeting Link</label>
                    <input value={updateData.meetLink} onChange={e => setUpdateData(p => ({ ...p, meetLink: e.target.value }))} className="input text-sm" placeholder="https://meet.google.com/..." />
                  </div>
                )}
              </div>
            )}

            {updateData.status === 'selected' && (
              <div className="space-y-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Offer Details</p>
                <div>
                  <label className="label text-xs">Package (₹ per annum)</label>
                  <input type="number" value={updateData.package} onChange={e => setUpdateData(p => ({ ...p, package: e.target.value }))} className="input text-sm" placeholder="e.g. 700000" />
                </div>
                <div>
                  <label className="label text-xs">Joining Date</label>
                  <input type="date" value={updateData.joiningDate} onChange={e => setUpdateData(p => ({ ...p, joiningDate: e.target.value }))} className="input text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="label">Feedback / Note (Optional)</label>
              <textarea value={updateData.feedback} onChange={e => setUpdateData(p => ({ ...p, feedback: e.target.value }))} className="input resize-none text-sm" rows={2} placeholder="Any notes for the candidate..." />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setSelected(null)} className="btn-secondary">Cancel</button>
              <button onClick={submitUpdate} disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
