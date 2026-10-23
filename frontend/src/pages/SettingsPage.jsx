import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  LogOut,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, isAuthenticated, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || 'Jharkhand, India');
      setAvatar(user.avatar || '');
    }
  }, [user, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await apiRequest('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          location: location.trim(),
          avatar: avatar.trim(),
        }),
      });

      if (res.success && res.data?.user) {
        updateUserProfile(res.data.user);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPwError('New password cannot be identical to current password.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      if (res.success) {
        setPwSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPwSuccess(false), 4000);
      }
    } catch (err) {
      setPwError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="settings-page-root">
      <div className="container settings-container">
        <LeftSidebar />
        <main className="settings-main-content">
          <header className="page-header settings-header-row">
            <BackButton fallback="/feed" label="Back to Feed" />
            <div className="settings-header-titles">
              <h1 className="page-title">Account Settings</h1>
              <p className="page-subtitle">
                Manage your personal details, biography, and security credentials.
              </p>
            </div>
          </header>

          {/* Profile Section */}
          <section className="settings-section">
            <div className="section-title-wrap">
              <User size={20} className="section-icon" />
              <div>
                <h2 className="section-title">Public Profile Details</h2>
                <p className="section-desc">These details are shown publicly on JanFeed alongside your posts.</p>
              </div>
            </div>

            {success && (
              <div className="settings-success-alert">
                <CheckCircle2 size={18} />
                <span>Profile settings updated successfully!</span>
              </div>
            )}

            {error && (
              <div className="settings-error-alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <form className="settings-form-card" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Registered)</label>
                <input
                  type="email"
                  className="form-input disabled-input"
                  value={user?.email || ''}
                  disabled
                />
                <span className="field-hint">Email address cannot be changed.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Location / District</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ranchi, Jharkhand"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profile Bio</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe your civic interests or community focus..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={300}
                />
                <span className="field-hint">{bio.length}/300 characters</span>
              </div>

              <div className="form-group">
                <label className="form-label">Avatar Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>

              <div className="settings-form-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-lg"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </section>

          {/* Change Password Section */}
          <section className="settings-section">
            <div className="section-title-wrap">
              <KeyRound size={20} className="section-icon" />
              <div>
                <h2 className="section-title">Change Password</h2>
                <p className="section-desc">Ensure your account is protected with a strong, secure password.</p>
              </div>
            </div>

            {pwSuccess && (
              <div className="settings-success-alert">
                <CheckCircle2 size={18} />
                <span>Password updated successfully!</span>
              </div>
            )}

            {pwError && (
              <div className="settings-error-alert">
                <AlertCircle size={18} />
                <span>{pwError}</span>
              </div>
            )}

            <form className="settings-form-card" onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="settings-pw-actions">
                <button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                  className="btn btn-primary"
                >
                  <ShieldCheck size={16} />
                  <span>{changingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
