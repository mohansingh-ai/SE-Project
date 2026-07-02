import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import {
  doc, getDoc, collection, query, where, onSnapshot,
  updateDoc, addDoc, serverTimestamp
} from 'firebase/firestore';
import Navbar from '../components/Navbar';
import CandidateCard from '../components/CandidateCard';
import MatchScoreBar from '../components/MatchScoreBar';
import SkillBadge from '../components/SkillBadge';
import { openResume } from '../utils';

export default function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [candidates, setCandidates] = useState({}); // { uid: candidateData }
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'date' | 'name'
  const [loading, setLoading] = useState(true);

  // Side-drawer state
  const [selected, setSelected] = useState(null); // { application, candidate }

  useEffect(() => {
    getDoc(doc(db, 'jobs', jobId)).then(snap => {
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
    });
  }, [jobId]);

  useEffect(() => {
    const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
    const unsub = onSnapshot(q, async (snap) => {
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApplications(apps);
      setLoading(false);

      // Fetch candidate profiles we don't have yet
      const missing = apps.map(a => a.candidateId).filter(id => !candidates[id]);
      for (const uid of missing) {
        const cSnap = await getDoc(doc(db, 'candidates', uid));
        if (cSnap.exists()) {
          setCandidates(prev => ({ ...prev, [uid]: cSnap.data() }));
        }
        // Also fetch user display name
        const uSnap = await getDoc(doc(db, 'users', uid));
        if (uSnap.exists()) {
          setCandidates(prev => ({ ...prev, [uid]: { ...prev[uid], ...uSnap.data() } }));
        }
      }
    });
    return unsub;
  }, [jobId]);

  async function handleStatusChange(appId, newStatus) {
    const app = applications.find(a => a.id === appId);
    await updateDoc(doc(db, 'applications', appId), { status: newStatus });

    // Create notification for the candidate
    await addDoc(collection(db, 'notifications'), {
      userId: app.candidateId,
      message: `Your application for "${job?.title}" has been updated to: ${newStatus}`,
      read: false,
      type: 'status_change',
      createdAt: serverTimestamp(),
    });
  }

  function getSorted(apps) {
    return [...apps].sort((a, b) => {
      if (sortBy === 'score') return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === 'date') return (b.appliedAt?.seconds || 0) - (a.appliedAt?.seconds || 0);
      if (sortBy === 'name') {
        const na = candidates[a.candidateId]?.name || '';
        const nb = candidates[b.candidateId]?.name || '';
        return na.localeCompare(nb);
      }
      return 0;
    });
  }

  const sorted = getSorted(applications);

  if (!job) return (
    <div className="app-shell"><Navbar />
      <div className="loading-screen"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <Link to="/recruiter" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</Link>
            {' → '}{job.title}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1>{job.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`status-dot ${job.status || 'open'}`} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{job.status === 'closed' ? 'Closed' : 'Open'}</span>
                <span className="badge badge-muted">{job.experienceLevel}</span>
                <span className="badge badge-accent">{applications.length} Applicants</span>
              </div>
            </div>
            <Link to={`/recruiter/jobs/${jobId}/edit`} className="btn btn-secondary btn-sm">
              ✏️ Edit Job
            </Link>
          </div>
        </div>

        {/* Required Skills */}
        <div className="card mb-4">
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Skills</h4>
          <div className="skill-list">
            {job.requiredSkills?.map(s => <SkillBadge key={s} skill={s} />)}
          </div>
        </div>

        {/* Sort controls */}
        <div className="sort-bar">
          <label>Sort by:</label>
          {['score', 'date', 'name'].map(s => (
            <button
              key={s}
              className={`sort-btn ${sortBy === s ? 'active' : ''}`}
              onClick={() => setSortBy(s)}
            >
              {s === 'score' ? '🎯 Match Score' : s === 'date' ? '📅 Applied Date' : '🔤 Name'}
            </button>
          ))}
        </div>

        {/* Candidate list */}
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><span>Loading candidates…</span></div>
        ) : sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No applications yet</h3>
            <p>Candidates will appear here once they apply to this job posting.</p>
          </div>
        ) : (
          <div className="grid-auto">
            {sorted.map((app, idx) => (
              <CandidateCard
                key={app.id}
                application={app}
                candidate={candidates[app.candidateId]}
                rank={idx + 1}
                onStatusChange={handleStatusChange}
                onViewDetails={(a, c) => setSelected({ application: a, candidate: c })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Side Drawer — full profile + comparison */}
      {selected && (
        <>
          <div className="drawer-overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div className="flex items-center justify-between mb-4">
              <h2>Candidate Profile</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
            </div>

            <div className="card mb-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="candidate-avatar" style={{ width: 52, height: 52, fontSize: '1.25rem' }}>
                  {selected.candidate?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3>{selected.candidate?.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{selected.candidate?.email}</div>
                  {selected.candidate?.phone && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{selected.candidate?.phone}</div>}
                </div>
              </div>
              <MatchScoreBar score={selected.application?.matchScore} />
            </div>

            {/* AI Explanation */}
            {selected.application?.matchDetails?.explanation && (
              <div className="alert alert-info mb-3">
                <strong>🤖 AI Analysis: </strong>
                {selected.application.matchDetails.explanation}
              </div>
            )}

            {/* Skill Comparison */}
            <div className="comparison-grid mb-3">
              <div className="comparison-col">
                <h4>✓ Matched Skills</h4>
                <div className="skill-list">
                  {selected.application?.matchDetails?.matchedSkills?.length > 0
                    ? selected.application.matchDetails.matchedSkills.map(s => <SkillBadge key={s} skill={s} variant="matched" />)
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None matched</span>
                  }
                </div>
              </div>
              <div className="comparison-col">
                <h4>✕ Missing Skills</h4>
                <div className="skill-list">
                  {selected.application?.matchDetails?.missingSkills?.length > 0
                    ? selected.application.matchDetails.missingSkills.map(s => <SkillBadge key={s} skill={s} variant="missing" />)
                    : <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>No gaps!</span>
                  }
                </div>
              </div>
            </div>

            {/* Candidate Skills */}
            <div className="card mb-3">
              <h4 style={{ marginBottom: '0.75rem' }}>All Candidate Skills</h4>
              <div className="skill-list">
                {selected.candidate?.parsedResume?.skills?.map(s => <SkillBadge key={s} skill={s} />) || 'N/A'}
              </div>
            </div>

            {/* Work Experience */}
            {selected.candidate?.parsedResume?.workExperience?.length > 0 && (
              <div className="card mb-3">
                <h4 style={{ marginBottom: '0.75rem' }}>Work Experience</h4>
                {selected.candidate.parsedResume.workExperience.map((w, i) => (
                  <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < selected.candidate.parsedResume.workExperience.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontWeight: 600 }}>{w.title}</div>
                    <div style={{ color: 'var(--accent-hover)', fontSize: '0.85rem' }}>{w.company}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{w.duration}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{w.description}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Resume link */}
             {selected.candidate?.resumeUrl && (
               <button
                 onClick={() => openResume(selected.candidate.resumeUrl, `${selected.candidate?.name || 'candidate'}_resume`)}
                 className="btn btn-secondary btn-full"
                 type="button"
               >
                 📄 View Original Resume
               </button>
             )}
          </div>
        </>
      )}
    </div>
  );
}
