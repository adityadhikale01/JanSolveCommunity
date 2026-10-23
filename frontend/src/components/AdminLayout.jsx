import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck2,
  AlertOctagon,
  Users,
  BarChart3,
  History,
  ArrowLeft,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './AdminLayout.css';

export default function AdminLayout() {
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      const fetchCounts = async () => {
        try {
          const res = await apiRequest('/admin/dashboard');
          if (res.success && res.data?.counts) {
            setPendingCount(res.data.counts.pendingReview || 0);
            setReportsCount(res.data.counts.pendingReports || 0);
          }
        } catch {
          // ignore
        }
      };
      fetchCounts();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="spinner" />
        <p>Verifying administrative privileges...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-root">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand-header">
          <div className="admin-brand-badge">
            <ShieldAlert size={20} />
            <span>JanSolve Admin</span>
          </div>
          <span className="admin-subtitle">Jharkhand Administration</span>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/challenges"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <FileCheck2 size={18} />
            <div className="nav-item-content">
              <span>Challenges Review</span>
              {pendingCount > 0 && (
                <span className="admin-pill-badge">{pendingCount}</span>
              )}
            </div>
          </NavLink>

          <NavLink
            to="/admin/moderation"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <AlertOctagon size={18} />
            <div className="nav-item-content">
              <span>Reported Queue</span>
              {reportsCount > 0 && (
                <span className="admin-pill-badge badge-alert">{reportsCount}</span>
              )}
            </div>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Users size={18} />
            <span>User Management</span>
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <BarChart3 size={18} />
            <span>Platform Analytics</span>
          </NavLink>

          <NavLink
            to="/admin/audit-logs"
            className={({ isActive }) =>
              `admin-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <History size={18} />
            <span>Audit Trail</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/feed" className="admin-nav-item citizen-view-link">
            <ArrowLeft size={18} />
            <span>Switch to JanFeed</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="admin-nav-item logout-link"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <h2 className="admin-page-title">Administrative Operations</h2>
          <div className="admin-current-user">
            <span className="admin-user-name">{user?.name}</span>
            <span className="admin-role-badge">SUPER ADMIN</span>
          </div>
        </header>

        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
