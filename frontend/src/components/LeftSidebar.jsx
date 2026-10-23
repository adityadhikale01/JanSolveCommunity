import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Home,
  Compass,
  MapPin,
  PlusCircle,
  FileText,
  Bookmark,
  MessageSquare,
  Bell,
  Settings,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './LeftSidebar.css';

export default function LeftSidebar({ isMobileDrawer = false, onClose }) {
  const { isAuthenticated, isAdmin } = useAuth();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`left-sidebar ${isMobileDrawer ? 'drawer-mode' : ''}`}>
      <div className="sidebar-section">
        <span className="sidebar-heading">COMMUNITY FEEDS</span>
        <nav className="sidebar-nav">
          <NavLink
            to="/feed"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Home size={19} />
            <span>Community Feed</span>
          </NavLink>
          <NavLink
            to="/explore"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Compass size={19} />
            <span>Explore Issues</span>
          </NavLink>
          <NavLink
            to="/nearby"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <MapPin size={19} />
            <span>Nearby Map</span>
          </NavLink>
          <NavLink
            to="/report"
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `sidebar-link highlight-link ${isActive ? 'active' : ''}`
            }
          >
            <PlusCircle size={19} />
            <span>Report a Problem</span>
          </NavLink>
        </nav>
      </div>

      {isAuthenticated ? (
        <div className="sidebar-section">
          <span className="sidebar-heading">MY CIVIC ACTIVITY</span>
          <nav className="sidebar-nav">
            <NavLink
              to="/my-challenges"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <FileText size={19} />
              <span>My Submissions</span>
            </NavLink>
            <NavLink
              to="/saved"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Bookmark size={19} />
              <span>Saved Challenges</span>
            </NavLink>
            <NavLink
              to="/messages"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <MessageSquare size={19} />
              <span>Private Messages</span>
            </NavLink>
            <NavLink
              to="/notifications"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Bell size={19} />
              <span>Notifications</span>
            </NavLink>
            <NavLink
              to="/settings"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Settings size={19} />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      ) : (
        <div className="sidebar-section guest-card">
          <div className="guest-card-header">
            <Sparkles size={16} color="#16a34a" />
            <span>Jharkhand Civic Community</span>
          </div>
          <p className="guest-card-text">
            Sign in to upvote, comment, message neighbors, and submit challenges in your district.
          </p>
          <div className="guest-btn-group">
            <Link
              to="/login"
              onClick={handleLinkClick}
              className="btn btn-outline btn-sm full-width"
            >
              <LogIn size={15} /> Log In
            </Link>
            <Link
              to="/register"
              onClick={handleLinkClick}
              className="btn btn-primary btn-sm full-width"
            >
              Join Platform
            </Link>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="sidebar-section admin-section">
          <span className="sidebar-heading admin-heading">ADMINISTRATION</span>
          <nav className="sidebar-nav">
            <NavLink
              to="/admin/dashboard"
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link admin-link ${isActive ? 'active' : ''}`
              }
            >
              <ShieldAlert size={19} />
              <span>JanSolve Portal</span>
            </NavLink>
          </nav>
        </div>
      )}
    </aside>
  );
}
