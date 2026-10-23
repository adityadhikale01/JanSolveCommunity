import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Check,
  X,
  Trash2,
  UserX,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api.js';
import './AdminPages.css';

export default function AdminModerationPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(
        `/admin/content-reports?status=${statusFilter}`
      );
      if (res.success && res.data?.reports) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = async (reportId, status, action = null) => {
    const note = prompt('Optional moderation note for this decision:') || '';
    try {
      await apiRequest(`/admin/content-reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          action,
          moderationNote: note,
        }),
      });
      fetchReports();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-h1">Content Moderation Queue</h1>
          <p className="admin-p">
            Review community reports for offensive comments, false claims, spam, or user violations.
          </p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="admin-filter-selects">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending Reports</option>
            <option value="reviewed">Reviewed</option>
            <option value="dismissed">Dismissed</option>
            <option value="All">All Reports</option>
          </select>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchReports}>
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      <div className="admin-panel-card">
        {loading ? (
          <div className="admin-loading-panel">
            <div className="spinner" />
          </div>
        ) : reports.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Target Type</th>
                  <th>Target Details</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <span className="badge badge-category uppercase">
                        {r.targetType}
                      </span>
                    </td>
                    <td>
                      {r.targetType === 'challenge' && (
                        <div>
                          <strong>{r.targetData?.title || 'Challenge'}</strong>
                          <br />
                          <Link
                            to={`/admin/challenges/${r.targetId}`}
                            className="text-link"
                          >
                            Open Challenge ↗
                          </Link>
                        </div>
                      )}
                      {r.targetType === 'comment' && (
                        <div className="comment-report-snippet">
                          "{r.targetData?.body || 'Comment'}"
                        </div>
                      )}
                      {r.targetType === 'user' && (
                        <div>
                          <strong>{r.targetData?.name || 'User'}</strong> (
                          {r.targetData?.email})
                        </div>
                      )}
                    </td>
                    <td>
                      <strong className="text-danger">{r.reason}</strong>
                      {r.details && <p className="report-dtls">{r.details}</p>}
                    </td>
                    <td>{r.reporter?.name || 'Citizen'}</td>
                    <td className="cell-date">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'pending' ? (
                        <div className="mod-actions-btn-group">
                          <button
                            className="btn btn-outline btn-sm"
                            title="Dismiss Report"
                            onClick={() => handleResolve(r._id, 'dismissed')}
                          >
                            Dismiss
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Remove Content"
                            onClick={() =>
                              handleResolve(r._id, 'action_taken', 'remove_content')
                            }
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                          {r.targetType === 'user' && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="Suspend User"
                              onClick={() =>
                                handleResolve(r._id, 'action_taken', 'suspend_user')
                              }
                            >
                              <UserX size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted text-sm">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-table">
            <Check size={36} color="#16a34a" />
            <p>Moderation queue is clean. No reports under this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
