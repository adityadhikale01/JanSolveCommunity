import React, { useState, useEffect } from 'react';
import { Search, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './AdminPages.css';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = '/admin/users?limit=30';
      if (search.trim()) query += `&search=${encodeURIComponent(search.trim())}`;
      if (statusFilter !== 'All') query += `&status=${statusFilter}`;

      const res = await apiRequest(query);
      if (res.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleToggleStatus = async (user) => {
    if (user._id === currentUser._id) {
      alert('Administrators cannot suspend their own account.');
      return;
    }

    const nextStatus = user.accountStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to change ${user.name}'s status to ${nextStatus}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await apiRequest(`/admin/users/${user._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-h1">Citizen Accounts Management</h1>
          <p className="admin-p">
            Oversee registered community members, monitor civic submission counts, and manage suspensions.
          </p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <form
          className="admin-search-form"
          onSubmit={(e) => {
            e.preventDefault();
            fetchUsers();
          }}
        >
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by citizen name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div className="admin-filter-selects">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      <div className="admin-panel-card">
        {loading ? (
          <div className="admin-loading-panel">
            <div className="spinner" />
          </div>
        ) : users.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Citizen Name</th>
                  <th>Email</th>
                  <th>District / Location</th>
                  <th>Role</th>
                  <th>Submissions</th>
                  <th>Joined</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.location || 'Jharkhand'}</td>
                    <td>
                      <span className="badge badge-category uppercase">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <strong>{u.challengeCount || 0}</strong>
                    </td>
                    <td className="cell-date">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.accountStatus === 'active'
                            ? 'badge-verified'
                            : 'badge-rejected'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td>
                      {u._id !== currentUser._id && (
                        <button
                          className={`btn btn-sm ${
                            u.accountStatus === 'active'
                              ? 'btn-danger'
                              : 'btn-outline'
                          }`}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.accountStatus === 'active' ? (
                            <>
                              <UserX size={13} /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} /> Restore
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-table">
            <p>No user accounts found matching your query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
