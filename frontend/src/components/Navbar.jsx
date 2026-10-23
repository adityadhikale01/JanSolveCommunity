import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Bell,
  MessageSquare,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Search,
  Bookmark,
  FileText,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './Navbar.css';

export default function Navbar({ onToggleSidebar }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Poll for unread counts when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCounts = async () => {
      try {
        const notifRes = await apiRequest('/notifications/unread-count');
        if (notifRes.success) {
          setUnreadNotifs(notifRes.data.unreadCount || 0);
        }

        const convRes = await apiRequest('/conversations');
        if (convRes.success && convRes.data.conversations) {
          const totalUnread = convRes.data.conversations.reduce(
            (acc, curr) => acc + (curr.unreadCount || 0),
            0
          );
          setUnreadMsgs(totalUnread);
        }
      } catch {
        // Silently handle polling errors
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 25000); // Poll every 25s
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand">
          <button
            type="button"
            className="mobile-sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation drawer"
            title="Open community navigation"
          >
            <Menu size={21} />
          </button>
          <Link to="/" className="brand-logo">
            <span className="brand-icon">JS</span>
            <div className="brand-text-group">
              <span className="brand-main">JanSolve</span>
              <span className="brand-sub">JanFeed</span>
            </div>
          </Link>
          <span className="brand-region-badge">Jharkhand</span>
        </div>

        {/* Global Search Bar */}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search challenges, districts, issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Navigation Actions */}
        <div className="navbar-actions">
          <Link to="/explore" className="nav-action-link" title="Explore Challenges">
            <Compass size={20} />
            <span className="nav-link-label">Explore</span>
          </Link>

          <Link to="/report" className="btn btn-primary btn-sm create-btn">
            <PlusCircle size={17} />
            <span>Report Problem</span>
          </Link>

          {isAuthenticated ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" className="nav-icon-btn" title="Notifications">
                <Bell size={20} />
                {unreadNotifs > 0 && <span className="nav-badge">{unreadNotifs}</span>}
              </Link>

              {/* Messages */}
              <Link to="/messages" className="nav-icon-btn" title="Private Messages">
                <MessageSquare size={20} />
                {unreadMsgs > 0 && <span className="nav-badge">{unreadMsgs}</span>}
              </Link>

              {/* Profile Dropdown */}
              <div className="user-dropdown-container" ref={dropdownRef}>
                <button
                  className="user-profile-trigger"
                  onClick={() => setShowDropdown(!showDropdown)}
                  aria-label="User menu"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="user-name-label">{user.name.split(' ')[0]}</span>
                </button>

                {showDropdown && (
                  <div className="dropdown-menu">
                    <div className="dropdown-user-header">
                      <strong>{user.name}</strong>
                      <span className="user-email-text">{user.email}</span>
                      <span className="user-role-pill">{user.role}</span>
                    </div>

                    <div className="dropdown-divider" />

                    <Link
                      to={`/profile/${user._id}`}
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <UserIcon size={16} /> My Public Profile
                    </Link>
                    <Link
                      to="/my-challenges"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <FileText size={16} /> My Submissions
                    </Link>
                    <Link
                      to="/saved"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Bookmark size={16} /> Saved Challenges
                    </Link>
                    <Link
                      to="/settings"
                      className="dropdown-item"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings size={16} /> Account Settings
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="dropdown-divider" />
                        <Link
                          to="/admin/dashboard"
                          className="dropdown-item admin-item"
                          onClick={() => setShowDropdown(false)}
                        >
                          <ShieldAlert size={16} /> Admin Portal
                        </Link>
                      </>
                    )}

                    <div className="dropdown-divider" />

                    <button
                      className="dropdown-item logout-btn"
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Join JanSolve
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
