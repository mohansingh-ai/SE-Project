import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot, getDocs,
  addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp, increment
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import SkillBadge from '../components/SkillBadge';
import MatchScoreBar from '../components/MatchScoreBar';
import { computeMatchScore } from '../gemini';

const STATUS_LABELS = {
  applied: { label: 'Under Review', color: 'var(--text-secondary)', icon: '📨' },
  reviewing: { label: 'Being Reviewed', color: 'var(--info)', icon: '🔍' },
  shortlisted: { label: 'Shortlisted!', color: 'var(--success)', icon: '⭐' },
  rejected: { label: 'Not Selected', color: 'var(--danger)', icon: '❌' },
};

export default function CandidateDashboard() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});       // { jobId: jobData }
  const [profile, setProfile] = useState(null);
  const [allJobs, setAllJobs] = useState([]);  // For browsing
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null); // jobId being applied to
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'browse'
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(null); // appId being withdrawn

  // Load candidate profile
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'candidates', currentUser.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    });
  }, [currentUser]);

  // Load applications (live)
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'applications'), where('candidateId', '==', currentUser.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApplications(apps);
      setLoading(false);

      // Fetch job details for each app
      for (const app of apps) {
        if (!jobs[app.jobId]) {
          const jSnap = await getDoc(doc(db, 'jobs', app.jobId));
          if (jSnap.exists()) setJobs(prev => ({ ...prev, [app.jobId]: { id: jSnap.id, ...jSnap.data() } }));
        }
      }
    });
    return unsub;
  }, [currentUser]);

  // Load all open jobs
  useEffect(() => {
    if (activeTab !== 'browse') return;
    getDocs(query(collection(db, 'jobs'), where('status', '!=', 'closed')))
      .then(snap => setAllJobs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeTab]);

  const appliedJobIds = new Set(applications.map(a => a.jobId));

  async function handleApply(job) {
    if (!profile?.parsedResume) {
      setError('Please upload your resume before applying. Go to My Profile first.');
      return;
    }
    if (appliedJobIds.has(job.id)) return;

    setError('');
    setApplying(job.id);
    try {
      // Compute AI match score
      const matchDetails = await computeMatchScore(profile.parsedResume, job);

      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        candidateId: currentUser.uid,
        matchScore: matchDetails.score,
        matchDetails,
        status: 'applied',
        appliedAt: serverTimestamp(),
      });

      // Increment application count on job
      await updateDoc(doc(db, 'jobs', job.id), { applicationCount: increment(1) });

      // Notify recruiter
      await addDoc(collection(db, 'notifications'), {
        userId: job.recruiterId,
        message: `New application for "${job.title}" — Match Score: ${matchDetails.score}%`,
        read: false,
        type: 'new_application',
        createdAt: serverTimestamp(),
      });

      setActiveTab('applications');
    } catch (err) {
      setError('Failed to apply: ' + err.message);
    } finally {
      setApplying(null);
    }
  }

  async function handleWithdraw(appId, jobId) {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    setError('');
    setWithdrawing(appId);
    try {
      await deleteDoc(doc(db, 'applications', appId));
      // Decrement application count on job
      try {
        await updateDoc(doc(db, 'jobs', jobId), { applicationCount: increment(-1) });
      } catch (err) {
        console.warn('Failed to decrement application count:', err);
      }
    } catch (err) {
      setError('Failed to withdraw application: ' + err.message);
    } finally {
      setWithdrawing(null);
    }
  }

  const stats = {
    total: applications.length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    avgScore: applications.length
      ? Math.round(applications.reduce((s, a) => s + (a.matchScore || 0), 0) / applications.length)
      : 0,
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1>Candidate Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Track your applications and discover new opportunities
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Applications</div>
            <div className="stat-value text-gradient">{stats.total}</div>
            <div className="stat-sub">Total submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Shortlisted</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.shortlisted}</div>
            <div className="stat-sub">You made the cut!</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Match Score</div>
            <div className="stat-value" style={{ color: 'var(--accent-hover)' }}>{stats.avgScore}%</div>
            <div className="stat-sub">AI-computed average</div>
          </div>
        </div>

        {/* Profile warning */}
        {!profile?.parsedResume && (
          <div className="alert alert-info mb-4">
            👋 <strong>Complete your profile first!</strong> Upload your resume so AI can compute match scores when you apply.
            {' '}<a href="/candidate/profile" style={{ color: 'var(--accent-hover)' }}>Go to My Profile →</a>
          </div>
        )}

        {error && <div className="alert alert-error mb-3">{error}</div>}

        {/* Tabs */}
        <div className="auth-tabs" style={{ maxWidth: 360, marginBottom: '1.5rem' }}>
          <button className={`auth-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
            My Applications ({stats.total})
          </button>
          <button className={`auth-tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
            Browse Jobs
          </button>
        </div>

        {/* MY APPLICATIONS tab */}
        {activeTab === 'applications' && (
          <>
            {loading ? (
              <div className="loading-screen"><div className="spinner" /></div>
            ) : applications.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No applications yet</h3>
                <p>Browse open jobs and apply — AI will instantly compute your match score!</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('browse')}>
                  Browse Jobs →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.map(app => {
                  const job = jobs[app.jobId];
                  const st = STATUS_LABELS[app.status] || STATUS_LABELS.applied;
                  return (
                    <div key={app.id} className="card">
                      <div className="flex items-center justify-between mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ marginBottom: '0.25rem' }}>{job?.title || 'Loading…'}</h3>
                          <span style={{ color: st.color, fontSize: '0.875rem' }}>
                            {st.icon} {st.label}
                          </span>
                        </div>
                        <div className="badge badge-accent" style={{ fontSize: '0.875rem', padding: '0.3rem 0.8rem' }}>
                          {app.matchScore}% Match
                        </div>
                      </div>

                      <div className="mb-3">
                        <MatchScoreBar score={app.matchScore} />
                      </div>

                      {/* Skill feedback */}
                      {app.matchDetails && (
                        <div className="comparison-grid">
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✓ Matched
                            </div>
                            <div className="skill-list">
                              {app.matchDetails.matchedSkills?.slice(0, 4).map(s => (
                                <SkillBadge key={s} skill={s} variant="matched" />
                              ))}
                              {!app.matchDetails.matchedSkills?.length && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✕ Missing / Upskill
                            </div>
                            <div className="skill-list">
                              {app.matchDetails.missingSkills?.slice(0, 4).map(s => (
                                <SkillBadge key={s} skill={s} variant="missing" />
                              ))}
                              {!app.matchDetails.missingSkills?.length && <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>All matched!</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          {app.matchDetails?.explanation && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                              🤖 {app.matchDetails.explanation}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'none' }}
                          onClick={() => handleWithdraw(app.id, app.jobId)}
                          disabled={withdrawing === app.id}
                        >
                          {withdrawing === app.id ? 'Withdrawing…' : 'Withdraw'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* BROWSE tab */}
        {activeTab === 'browse' && (
          <div className="grid-auto">
            {allJobs.length === 0 ? (
              <div className="loading-screen"><div className="spinner" /><span>Loading jobs…</span></div>
            ) : (
              allJobs.map(job => (
                <div key={job.id} className="job-card">
                  <div className="job-card-header">
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '0.25rem' }}>{job.title}</h3>
                      <div className="job-card-meta">
                        <span className="job-meta-item">{job.experienceLevel}</span>
                        <span className="job-meta-item">{job.applicationCount || 0} applicants</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7' }}>
                    {job.description?.slice(0, 150)}{job.description?.length > 150 ? '…' : ''}
                  </p>

                  <div className="job-card-skills">
                    {job.requiredSkills?.slice(0, 5).map(s => <SkillBadge key={s} skill={s} />)}
                    {job.requiredSkills?.length > 5 && <span className="badge badge-muted">+{job.requiredSkills.length - 5}</span>}
                  </div>

                  <button
                    className={`btn btn-sm ${appliedJobIds.has(job.id) ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleApply(job)}
                    disabled={appliedJobIds.has(job.id) || applying === job.id}
                  >
                    {applying === job.id ? (
                      <><span className="spinner spinner-sm" /> Computing match…</>
                    ) : appliedJobIds.has(job.id) ? '✓ Applied' : 'Apply Now'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
