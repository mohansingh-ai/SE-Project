import React from 'react';
import MatchScoreBar from './MatchScoreBar';
import SkillBadge from './SkillBadge';

export default function CandidateCard({ application, candidate, rank, onViewDetails, onStatusChange }) {
  const initials = candidate?.name
    ? candidate.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const STATUS_OPTIONS = ['applied', 'reviewing', 'shortlisted', 'rejected'];
  const STATUS_COLORS = {
    applied: 'var(--text-secondary)',
    reviewing: 'var(--info)',
    shortlisted: 'var(--success)',
    rejected: 'var(--danger)',
  };

  return (
    <div className="candidate-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="candidate-rank">#{rank}</span>
        <div className="candidate-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{candidate?.name || 'Unknown'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{candidate?.email}</div>
        </div>
        <select
          className="status-select"
          value={application.status || 'applied'}
          onChange={(e) => onStatusChange?.(application.id, e.target.value)}
          style={{ color: STATUS_COLORS[application.status] || 'var(--text-secondary)' }}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <MatchScoreBar score={application.matchScore} />
      </div>

      <div className="flex-wrap flex gap-1 mb-3">
        {application.matchDetails?.matchedSkills?.slice(0, 4).map(s => (
          <SkillBadge key={s} skill={s} variant="matched" />
        ))}
        {application.matchDetails?.missingSkills?.slice(0, 2).map(s => (
          <SkillBadge key={s} skill={s} variant="missing" />
        ))}
      </div>

      <button className="btn btn-secondary btn-sm btn-full" onClick={() => onViewDetails?.(application, candidate)}>
        View Full Profile & Comparison
      </button>
    </div>
  );
}
