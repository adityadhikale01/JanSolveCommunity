import React, { useState, useEffect } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import './AdminPages.css';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiRequest(`/admin/audit-logs?page=${p}&limit=25`);
      if (res.success && res.data) {
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages || 1);
        setPage(p);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-h1">System Audit Trail</h1>
          <p className="admin-p">
            Immutable log of all administrative decisions, verifications, status changes, and moderation actions.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => fetchLogs(page)}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="admin-panel-card">
        {loading ? (
          <div className="admin-loading-panel">
            <div className="spinner" />
          </div>
        ) : logs.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Administrator</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Metadata Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="cell-date">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <strong>{log.actor?.name || 'Administrator'}</strong>
                      <br />
                      <span className="text-muted text-xs">
                        {log.actor?.email}
                      </span>
                    </td>
                    <td>
                      <span className="audit-action-tag">{log.action}</span>
                    </td>
                    <td>{log.targetType}</td>
                    <td className="cell-id text-xs">{log.targetId}</td>
                    <td>
                      {log.metadata?.note ? (
                        <span>"{log.metadata.note}"</span>
                      ) : log.metadata?.reason ? (
                        <span>"{log.metadata.reason}"</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-table">
            <p>No audit events recorded yet.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-bar admin-pagination">
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => fetchLogs(page - 1)}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => fetchLogs(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
