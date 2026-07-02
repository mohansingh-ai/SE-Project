import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';

export default function RecruiterDashboard() {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, applications: 0 });

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'jobs'),
      where('recruiterId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJobs(data);
      setStats({
        total: data.length,
        open: data.filter(j => j.status !== 'closed').length,
        applications: data.reduce((sum, j) => sum + (j.applicationCount || 0), 0),
      });
      setLoading(false);
    });
    return unsub;
  }, [currentUser]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="page-header" style={{ margin: 0 }}>
            <h1>Recruiter Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Manage your job postings and review AI-ranked candidates
            </p>
          </div>
          <Link to="/recruiter/jobs/new" className="btn btn-primary">
            + Post New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="dash-stats">
          <div className="stat-card">
            <div className="stat-label">Total Jobs</div>
            <div className="stat-value text-gradient">{stats.total}</div>
            <div className="stat-sub">Posted by you</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open Positions</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.open}</div>
            <div className="stat-sub">Actively hiring</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">AI Model</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', paddingTop: '0.35rem' }}>Gemini 2.0</div>
            <div className="stat-sub">Flash · Semantic matching</div>
          </div>
        </div>

        {/* Job listings */}
        <div className="section-title">
          <h2>Your Job Postings</h2>
          {jobs.length > 0 && <span className="section-count">{jobs.length}</span>}
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner" /><span>Loading jobs…</span></div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No jobs posted yet</h3>
            <p>Create your first job posting to start receiving AI-matched candidates</p>
            <Link to="/recruiter/jobs/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Post Your First Job
            </Link>
          </div>
        ) : (
          <div className="grid-auto">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} isRecruiter />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
