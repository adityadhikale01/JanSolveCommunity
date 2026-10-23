import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  MapPin,
  Info,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './MyChallengesPage.css';

const TABS = [
  { id: 'all', label: 'All Submissions' },
  { id: 'submitted', label: 'Pending Review' },
  { id: 'information_requested', label: 'Action Needed' },
  { id: 'verified', label: 'Verified' },
  { id: 'rejected', label: 'Rejected' },
];

export default function MyChallengesPage() {
  const { isAuthenticated } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMine = async () => {
      setLoading(true);
      try {
        const query = activeTab === 'all' ? '' : `?status=${activeTab}`;
        const res = await apiRequest(`/challenges/mine${query}`);
        if (res.success && res.data?.challenges) {
          setChallenges(res.data.challenges);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMine();
    }
  }, [activeTab, isAuthenticated]);

  return (
    <div className="my-challenges-root">
      <div className="container my-challenges-container">
        <LeftSidebar />
        <main className="my-challenges-main-content">
          <header className="page-header my-challenges-header">
            <div className="header-left-col">
              <BackButton fallback="/feed" label="Back to Feed" />
              <div>
                <h1 className="page-title">My Civic Submissions</h1>
                <p className="page-subtitle">
                  Track the progress, administrative review status, and feedback on issues you have reported across Jharkhand.
                </p>
              </div>
            </div>
            <Link to="/report" className="btn btn-primary btn-sm">
              <PlusCircle size={17} />
              <span>Report New Issue</span>
            </Link>
          </header>

        {/* Status Tabs */}
        <div className="tabs-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="submissions-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading your submissions...</p>
            </div>
          ) : challenges.length > 0 ? (
            challenges.map((c) => (
              <div key={c._id} className="submission-card">
                <div className="sub-card-top">
                  <div className="sub-title-group">
                    <span className="badge badge-category">{c.category}</span>
                    <span className={`badge badge-${c.urgency}`}>{c.urgency}</span>
                    <span className={`badge badge-${c.reviewStatus}`}>
                      {c.reviewStatus.replace('_', ' ')}
                    </span>
                    <span
                      className={`badge badge-${c.publicationStatus}`}
                      title="JanFeed Visibility"
                    >
                      {c.publicationStatus === 'published'
                        ? 'Published on JanFeed'
                        : 'Unpublished'}
                    </span>
                  </div>

                  <Link to={`/challenges/${c._id}`} className="view-detail-btn">
                    <span>View Challenge</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>

                <h3 className="sub-card-title">
                  <Link to={`/challenges/${c._id}`}>{c.title}</Link>
                </h3>

                <p className="sub-card-desc">{c.description.slice(0, 200)}...</p>

                <div className="sub-meta-bar">
                  <span className="sub-meta-item">
                    <MapPin size={13} />
                    {c.locationText}
                  </span>
                  <span>•</span>
                  <span className="sub-meta-item">
                    <Clock size={13} />
                    Submitted on{' '}
                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* If Admin left a review note (e.g. info requested or rejection) */}
                {c.reviewNote && (
                  <div
                    className={`sub-admin-note-box note-${c.reviewStatus}`}
                  >
                    <Info size={16} />
                    <div>
                      <strong>Administrator Note:</strong>
                      <p>{c.reviewNote}</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FileText size={40} color="#94a3b8" />
              <h3>No submissions found</h3>
              <p>You haven't submitted any challenges under this status tab.</p>
              <Link to="/report" className="btn btn-primary btn-sm">
                Report a Community Issue
              </Link>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
