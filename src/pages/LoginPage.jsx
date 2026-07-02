import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'candidate';

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  function redirectByRole(r) {
    if (r === 'recruiter') navigate('/recruiter');
    else navigate('/candidate');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
        // Role will be fetched by AuthContext; wait briefly then redirect
        setTimeout(() => {
          // Navigate after login — role is now loaded in context
        }, 100);
        // Redirect based on stored role (read from firestore in AuthContext)
        // Use a workaround: redirect to / and let App.jsx route by role
        navigate('/');
      } else {
        await register(email, password, name, role);
        redirectByRole(role);
      }
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' ? 'Incorrect password.'
        : err.code === 'auth/user-not-found' ? 'No account with that email.'
        : err.code === 'auth/email-already-in-use' ? 'Email already registered.'
        : err.message || 'Authentication failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-big">⚡</div>
          <h2>TalentAI</h2>
          <p>{tab === 'login' ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>
            Sign In
          </button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Role selector (register only) */}
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">I am a…</label>
              <div className="role-select-row">
                <button
                  type="button"
                  className={`role-option ${role === 'candidate' ? 'selected' : ''}`}
                  onClick={() => setRole('candidate')}
                >
                  🎓 Candidate
                </button>
                <button
                  type="button"
                  className={`role-option ${role === 'recruiter' ? 'selected' : ''}`}
                  onClick={() => setRole('recruiter')}
                >
                  👔 Recruiter
                </button>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? (
              <><span className="spinner spinner-sm" /> Processing…</>
            ) : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
