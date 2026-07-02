import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import TagInput from '../components/TagInput';

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: '🌱 Junior (0–2 years)' },
  { value: 'mid', label: '🚀 Mid-Level (2–5 years)' },
  { value: 'senior', label: '⭐ Senior (5+ years)' },
];

export default function JobPostingForm() {
  const { jobId } = useParams();
  const isEdit = !!jobId;
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    requiredSkills: [],
    experienceLevel: 'mid',
    status: 'open',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getDoc(doc(db, 'jobs', jobId)).then(snap => {
      if (snap.exists()) setForm({ ...snap.data(), requiredSkills: snap.data().requiredSkills || [] });
      setFetching(false);
    });
  }, [jobId, isEdit]);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Job title is required.'); return; }
    if (form.requiredSkills.length === 0) { setError('Add at least one required skill.'); return; }

    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        recruiterId: currentUser.uid,
        updatedAt: serverTimestamp(),
      };

      if (isEdit) {
        await updateDoc(doc(db, 'jobs', jobId), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.applicationCount = 0;
        await addDoc(collection(db, 'jobs'), payload);
      }

      navigate('/recruiter');
    } catch (err) {
      setError(err.message || 'Failed to save job.');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return (
    <div className="app-shell"><Navbar />
      <div className="loading-screen"><div className="spinner" /><span>Loading job…</span></div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 720 }}>
        <div className="page-header">
          <div className="breadcrumb">Recruiter Dashboard → {isEdit ? 'Edit Job' : 'Post New Job'}</div>
          <h1>{isEdit ? 'Edit Job Posting' : 'Create Job Posting'}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            The AI will use this to rank and match candidates semantically.
          </p>
        </div>

        <div className="card-glass">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Job Title *</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Senior React Developer"
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Description *</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the role, responsibilities, and what makes it exciting…"
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={6}
                required
                style={{ minHeight: 160 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Required Skills *</label>
              <TagInput
                tags={form.requiredSkills}
                onChange={skills => handleChange('requiredSkills', skills)}
                placeholder="Type a skill and press Enter (e.g. React, Python, AWS…)"
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Press Enter or comma to add each skill. The AI uses these for semantic matching.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level *</label>
              <select
                className="form-select"
                value={form.experienceLevel}
                onChange={e => handleChange('experienceLevel', e.target.value)}
              >
                {EXPERIENCE_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="open">🟢 Open — Accepting Applications</option>
                  <option value="closed">🔴 Closed — Not Accepting</option>
                </select>
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/recruiter')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner spinner-sm" /> Saving…</> : isEdit ? '💾 Update Job' : '🚀 Publish Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
