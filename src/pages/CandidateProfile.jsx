import React, { useEffect, useState } from 'react';
import { db, storage } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ResumeUploader from '../components/ResumeUploader';
import SkillBadge from '../components/SkillBadge';
import { parseResume } from '../gemini';
import { openResume } from '../utils';

export default function CandidateProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Manual profile fields
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'candidates', currentUser.uid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile(d);
        setPhone(d.phone || '');
      }
      setLoading(false);
    });
  }, [currentUser]);

  async function handleResumeExtracted(text, downloadURL) {
    setParsing(true);
    setError('');
    setSuccess('');
    try {
      const parsed = await parseResume(text);

      const profileData = {
        uid: currentUser.uid,
        name: parsed.name || currentUser.displayName || '',
        email: parsed.email || currentUser.email || '',
        phone: parsed.phone || phone || '',
        resumeUrl: downloadURL,
        parsedResume: parsed,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'candidates', currentUser.uid), profileData, { merge: true });
      setProfile(profileData);
      setPhone(parsed.phone || phone);
      setSuccess('✅ Resume parsed and profile updated successfully!');
    } catch (err) {
      console.error(err);
      setError('AI parsing failed: ' + err.message);
    } finally {
      setParsing(false);
    }
  }

  async function savePhone(e) {
    e.preventDefault();
    setSaving(true);
    await setDoc(doc(db, 'candidates', currentUser.uid), { phone, updatedAt: serverTimestamp() }, { merge: true });
    setSaving(false);
    setSuccess('Phone number saved.');
  }

  if (loading) return (
    <div className="app-shell"><Navbar />
      <div className="loading-screen"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-content" style={{ maxWidth: 860 }}>
        <div className="page-header">
          <h1>My Profile</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Upload your resume and let AI extract your skills automatically.
          </p>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left: Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card-glass">
              <h3 style={{ marginBottom: '1rem' }}>📤 Upload Resume</h3>
              <ResumeUploader
                uid={currentUser.uid}
                onTextExtracted={handleResumeExtracted}
              />
              {parsing && (
                <div className="alert alert-info mt-2">
                  <span className="spinner spinner-sm" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
                  Gemini AI is analyzing your resume…
                </div>
              )}
              {error && <div className="alert alert-error mt-2">{error}</div>}
              {success && <div className="alert alert-success mt-2">{success}</div>}
            </div>

            {/* Phone */}
            <div className="card-glass">
              <h3 style={{ marginBottom: '1rem' }}>📞 Contact Info</h3>
              <form onSubmit={savePhone} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  className="form-input"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <button className="btn btn-primary" disabled={saving} style={{ flexShrink: 0 }}>
                  {saving ? '…' : 'Save'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Parsed profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {profile?.parsedResume ? (
              <>
                {/* Identity */}
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="candidate-avatar" style={{ width: 52, height: 52, fontSize: '1.25rem', flexShrink: 0 }}>
                      {profile.parsedResume.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
                    </div>
                    <div>
                      <h3>{profile.parsedResume.name}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{profile.parsedResume.email}</div>
                      {profile.parsedResume.phone && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{profile.parsedResume.phone}</div>}
                    </div>
                  </div>
                  {profile.parsedResume.summary && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7' }}>
                      {profile.parsedResume.summary}
                    </p>
                  )}
                </div>

                {/* Skills */}
                <div className="card">
                  <h4 style={{ marginBottom: '0.75rem' }}>🛠 Extracted Skills</h4>
                  <div className="skill-list">
                    {profile.parsedResume.skills?.length > 0
                      ? profile.parsedResume.skills.map(s => <SkillBadge key={s} skill={s} />)
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills extracted yet</span>
                    }
                  </div>
                </div>

                {/* Education */}
                {profile.parsedResume.education?.length > 0 && (
                  <div className="card">
                    <h4 style={{ marginBottom: '0.75rem' }}>🎓 Education</h4>
                    {profile.parsedResume.education.map((e, i) => (
                      <div key={i} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.degree}</div>
                        <div style={{ color: 'var(--accent-hover)', fontSize: '0.85rem' }}>{e.institution}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{e.year}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Work Experience */}
                {profile.parsedResume.workExperience?.length > 0 && (
                  <div className="card">
                    <h4 style={{ marginBottom: '0.75rem' }}>💼 Work Experience</h4>
                    {profile.parsedResume.workExperience.map((w, i) => (
                      <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: i < profile.parsedResume.workExperience.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ fontWeight: 600 }}>{w.title}</div>
                        <div style={{ color: 'var(--accent-hover)', fontSize: '0.85rem' }}>{w.company}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{w.duration}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{w.description}</div>
                      </div>
                    ))}
                  </div>
                )}

                {profile.resumeUrl && (
                  <button
                    onClick={() => openResume(profile.resumeUrl, `${profile.parsedResume?.name || 'resume'}_resume`)}
                    className="btn btn-secondary btn-full"
                    type="button"
                  >
                    📄 View Uploaded Resume
                  </button>
                )}
              </>
            ) : (
              <div className="empty-state card">
                <div className="empty-icon">📋</div>
                <h3>No profile yet</h3>
                <p>Upload your resume to auto-fill your profile with AI.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
