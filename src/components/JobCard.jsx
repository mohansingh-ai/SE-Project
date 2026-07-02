import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import SkillBadge from './SkillBadge';

const EXPERIENCE_LABELS = { junior: '🌱 Junior', mid: '🚀 Mid-Level', senior: '⭐ Senior' };

export default function JobCard({ job, isRecruiter = false, onApply, applied = false }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Delete this job posting?')) return;
    setDeleting(true);
    await deleteDoc(doc(db, 'jobs', job.id));
  }

  async function toggleStatus() {
    await updateDoc(doc(db, 'jobs', job.id), {
      status: job.status === 'open' ? 'closed' : 'open',
    });
  }

  const postedDate = job.createdAt?.toDate
    ? job.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-1 mb-1">
            <span className={`status-dot ${job.status || 'open'}`} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {job.status === 'closed' ? 'Closed' : 'Hiring'}
            </span>
          </div>
          <h3 style={{ marginBottom: '0.25rem' }}>{job.title}</h3>
          <div className="job-card-meta">
            <span className="job-meta-item">📅 {postedDate}</span>
            <span className="job-meta-item">
              {EXPERIENCE_LABELS[job.experienceLevel] || job.experienceLevel}
            </span>
          </div>
        </div>

        {isRecruiter && (
          <div className="job-card-actions">
            <Link to={`/recruiter/jobs/${job.id}`} className="btn btn-secondary btn-sm">
              View Candidates
            </Link>
            <Link to={`/recruiter/jobs/${job.id}/edit`} className="btn btn-secondary btn-sm">
              ✏️
            </Link>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7' }}>
        {job.description?.slice(0, 180)}{job.description?.length > 180 ? '…' : ''}
      </p>

      <div className="job-card-skills">
        {job.requiredSkills?.slice(0, 6).map(skill => (
          <SkillBadge key={skill} skill={skill} />
        ))}
        {job.requiredSkills?.length > 6 && (
          <span className="badge badge-muted">+{job.requiredSkills.length - 6} more</span>
        )}
      </div>

      {!isRecruiter && (
        <div className="flex items-center justify-between mt-2">
          {isRecruiter ? null : (
            <button
              className={`btn btn-sm ${applied ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onApply?.(job)}
              disabled={applied || job.status === 'closed'}
            >
              {applied ? '✓ Applied' : job.status === 'closed' ? 'Closed' : 'Apply Now'}
            </button>
          )}
          {isRecruiter && (
            <button className="btn btn-secondary btn-sm" onClick={toggleStatus}>
              {job.status === 'open' ? 'Close Job' : 'Reopen Job'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
