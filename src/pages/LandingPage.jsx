import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const FEATURES = [
  { icon: '🤖', title: 'AI Resume Parsing', desc: 'Gemini AI extracts skills, experience, and education automatically from any PDF or DOCX.' },
  { icon: '🎯', title: 'Semantic Matching', desc: 'Beyond keyword search — AI understands that "ReactJS" equals "React.js" and ranks candidates fairly.' },
  { icon: '📊', title: 'Ranked Leaderboards', desc: 'Recruiters get a scored, sortable list of applicants with instant skill-gap analysis.' },
  { icon: '🔔', title: 'Real-time Notifications', desc: 'Candidates are notified instantly when their application status changes.' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar />

      <section className="landing-hero">
        <div className="badge badge-accent" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
          ✨ Powered by Gemini AI
        </div>

        <h1>
          Hire Smarter with <br />
          <span className="text-gradient">AI-Powered Recruiting</span>
        </h1>

        <p>
          Automatically parse resumes, rank candidates by semantic match score,
          and streamline your entire hiring workflow — all in one place.
        </p>

        <div className="role-cards">
          <Link to="/login?role=recruiter" className="role-card">
            <div className="role-icon">👔</div>
            <h3>I'm a Recruiter</h3>
            <p>Post jobs, review AI-ranked candidates, and manage your pipeline</p>
            <div className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
              Get Started →
            </div>
          </Link>

          <Link to="/login?role=candidate" className="role-card">
            <div className="role-icon">🎓</div>
            <h3>I'm a Candidate</h3>
            <p>Upload your resume, get instant skill feedback, and apply to jobs</p>
            <div className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
              Find Jobs →
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          Everything you need to <span className="text-gradient">hire with confidence</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          From resume to offer letter, TalentAI handles the heavy lifting.
        </p>

        <div className="grid-2">
          {FEATURES.map(f => (
            <div key={f.title} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '2rem', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <h4 style={{ marginBottom: '0.35rem' }}>{f.title}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        TalentAI · Built with Firebase & Gemini AI
      </footer>
    </div>
  );
}
