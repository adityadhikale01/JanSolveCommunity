import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import BackButton from '../components/BackButton.jsx';
import './AuthPages.css';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role !== 'admin') {
        setError('Access denied: This account does not possess administrator privileges.');
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root admin-auth-bg">
      <div className="auth-card admin-auth-card">
        <div className="auth-back-row">
          <BackButton fallback="/" label="Citizen Portal" />
        </div>
        <div className="auth-card-header">
          <div className="admin-icon-wrap">
            <ShieldAlert size={28} />
          </div>
          <h2>JanSolve Administrative Portal</h2>
          <p>Restricted access for authorized Jharkhand moderators and staff</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Administrator Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@jansolve.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Administrator Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg auth-submit-btn admin-login-btn"
          >
            {loading ? 'Verifying Credentials...' : 'Authenticate as Administrator'}
          </button>
        </form>

        <div className="auth-card-footer">
          <Link to="/" className="back-to-citizen-link">
            <ArrowLeft size={16} />
            <span>Return to JanFeed Citizen Platform</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
