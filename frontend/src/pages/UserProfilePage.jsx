import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  MapPin,
  Calendar,
  MessageSquare,
  Award,
  FileText,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import BackButton from '../components/BackButton.jsx';
import './UserProfilePage.css';

export default function UserProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [profRes, chalRes] = await Promise.all([
          apiRequest(`/users/${id}`),
          apiRequest(`/users/${id}/challenges`),
        ]);

        if (profRes.success && profRes.data?.user) {
          setProfile(profRes.data.user);
        }
        if (chalRes.success && chalRes.data?.challenges) {
          setChallenges(chalRes.data.challenges);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="container profile-loading">
        <div className="spinner" />
        <p>Loading citizen profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container profile-empty">
        <h2>Citizen Not Found</h2>
        <p>This profile does not exist or may have been deactivated.</p>
        <Link to="/feed" className="btn btn-primary btn-sm">
          Return to Feed
        </Link>
      </div>
    );
  }

  const isSelf = currentUser && currentUser._id === profile._id;

  return (
    <div className="profile-page-root">
      <div className="container profile-container">
        <LeftSidebar />
        <main className="profile-main-content">
          <div className="profile-back-bar">
            <BackButton fallback="/feed" label="Back to Feed" />
          </div>
          {/* Profile Header Card */}
          <div className="profile-header-card">
          <div className="profile-hero-banner" />

          <div className="profile-details-wrap">
            <div className="profile-avatar-row">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="profile-large-avatar"
                />
              ) : (
                <div className="profile-large-placeholder">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="profile-header-actions">
                {isSelf ? (
                  <Link to="/settings" className="btn btn-outline btn-sm">
                    <Edit3 size={15} />
                    <span>Edit Profile</span>
                  </Link>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/messages?recipient=${profile._id}`)}
                  >
                    <MessageSquare size={15} />
                    <span>Message Citizen</span>
                  </button>
                )}
              </div>
            </div>

            <div className="profile-bio-group">
              <div className="profile-name-role">
                <h1 className="profile-name">{profile.name}</h1>
                <span className="profile-role-tag">{profile.role}</span>
              </div>

              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              <div className="profile-meta-chips">
                <span className="meta-chip">
                  <MapPin size={14} />
                  {profile.location || 'Jharkhand, India'}
                </span>
                <span className="meta-chip">
                  <Calendar size={14} />
                  Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Impact Metric Chips */}
            <div className="profile-stats-grid">
              <div className="profile-stat-box">
                <span className="stat-val">
                  {profile.stats?.publishedChallengesCount || 0}
                </span>
                <span className="stat-label">Published Issues</span>
              </div>
              <div className="profile-stat-box">
                <span className="stat-val">
                  {profile.stats?.totalKarma || 0}
                </span>
                <span className="stat-label">Community Karma</span>
              </div>
            </div>
          </div>
        </div>

        {/* User's Public Challenges */}
        <section className="profile-challenges-section">
          <div className="section-title-wrap">
            <FileText size={20} color="#16a34a" />
            <h2>Published Community Reports ({challenges.length})</h2>
          </div>

          <div className="profile-challenges-list">
            {challenges.length > 0 ? (
              challenges.map((c) => (
                <ChallengeCard key={c._id} challenge={c} />
              ))
            ) : (
              <div className="profile-no-posts">
                <p>No public challenges published yet by this citizen.</p>
              </div>
            )}
          </div>
        </section>
        </main>
      </div>
    </div>
  );
}
