import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  AlertOctagon,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import './AdminPages.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-panel">
        <div className="spinner" />
        <p>Loading real-time database metrics...</p>
      </div>
    );
  }

  const counts = stats?.counts || {};
  const categories = stats?.categoryStats || [];
  const urgencies = stats?.urgencyStats || [];
  const recents = stats?.recentSubmissions || [];

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-h1">JanSolve Administration Overview</h1>
          <p className="admin-p">
            Authoritative platform activity, moderation queues, and civic review metrics for Jharkhand.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchStats}>
          <RefreshCw size={15} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon icon-pending">
            <Clock size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-title">Pending Review</span>
            <span className="stat-number">{counts.pendingReview || 0}</span>
          </div>
          <Link to="/admin/challenges?publicationStatus=pending_review" className="stat-card-link">
            Open review queue →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon icon-verified">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-title">Verified Issues</span>
            <span className="stat-number">{counts.verified || 0}</span>
          </div>
          <Link to="/admin/challenges?reviewStatus=verified" className="stat-card-link">
            View verified →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon icon-published">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-title">Published on JanFeed</span>
            <span className="stat-number">{counts.published || 0}</span>
          </div>
          <Link to="/admin/challenges?publicationStatus=published" className="stat-card-link">
            View active →
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon icon-reports">
            <AlertOctagon size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-title">Reported Content</span>
            <span className="stat-number">{counts.pendingReports || 0}</span>
          </div>
          <Link to="/admin/moderation" className="stat-card-link">
            Moderation queue →
          </Link>
        </div>
      </div>

      {/* 2-column breakdowns */}
      <div className="admin-charts-grid">
        {/* Category Breakdown */}
        <div className="admin-panel-card">
          <h3 className="panel-card-title">Submissions by Civic Domain</h3>
          <div className="category-bars-list">
            {categories.map((c) => {
              const pct = Math.round(
                (c.count / (counts.totalChallenges || 1)) * 100
              );
              return (
                <div key={c._id} className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-name">{c._id}</span>
                    <span className="bar-count">
                      {c.count} ({pct}%)
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgency Breakdown */}
        <div className="admin-panel-card">
          <h3 className="panel-card-title">Submissions by Urgency Severity</h3>
          <div className="category-bars-list">
            {urgencies.map((u) => {
              const pct = Math.round(
                (u.count / (counts.totalChallenges || 1)) * 100
              );
              return (
                <div key={u._id} className="bar-row">
                  <div className="bar-label-group">
                    <span className="bar-name uppercase">{u._id}</span>
                    <span className="bar-count">
                      {u.count} ({pct}%)
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill urgency-fill-${u._id}`}
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending / Recent Submissions Queue */}
      <div className="admin-panel-card">
        <div className="panel-header-row">
          <h3 className="panel-card-title">Recent Submissions Review Queue</h3>
          <Link to="/admin/challenges" className="btn btn-outline btn-sm">
            View All ({counts.totalChallenges || 0})
          </Link>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Domain</th>
                <th>Author</th>
                <th>Date</th>
                <th>Urgency</th>
                <th>Review Status</th>
                <th>JanFeed Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recents.map((c) => (
                <tr key={c._id}>
                  <td className="cell-title font-medium">{c.title}</td>
                  <td>
                    <span className="badge badge-category">{c.category}</span>
                  </td>
                  <td>{c.author?.name || 'Citizen'}</td>
                  <td className="cell-date">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td>
                    <span className={`badge badge-${c.urgency}`}>
                      {c.urgency}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.reviewStatus}`}>
                      {c.reviewStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.publicationStatus}`}>
                      {c.publicationStatus}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/challenges/${c._id}`}
                      className="btn btn-primary btn-sm btn-table-action"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
