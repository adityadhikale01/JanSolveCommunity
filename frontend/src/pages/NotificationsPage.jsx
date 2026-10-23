import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  Mail,
  Info,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/notifications');
      return;
    }

    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/notifications');
        if (res.success && res.data?.notifications) {
          setNotifications(res.data.notifications);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchNotifs();
  }, [isAuthenticated, navigate]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date() }))
      );
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.readAt) {
      apiRequest(`/notifications/${notif._id}/read`, { method: 'PATCH' }).catch(
        () => {}
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, readAt: new Date() } : n))
      );
    }

    if (notif.entityType === 'challenge' || notif.entityType === 'comment') {
      navigate(`/challenges/${notif.entityId}`);
    } else if (notif.entityType === 'conversation') {
      navigate(`/messages`);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'challenge_approved':
      case 'challenge_verified':
        return <ShieldCheck size={18} color="#16a34a" />;
      case 'challenge_rejected':
        return <AlertCircle size={18} color="#dc2626" />;
      case 'info_requested':
        return <Info size={18} color="#d97706" />;
      case 'comment':
      case 'reply':
        return <MessageSquare size={18} color="#2563eb" />;
      case 'vote':
        return <ThumbsUp size={18} color="#ea580c" />;
      case 'new_message':
        return <Mail size={18} color="#7c3aed" />;
      default:
        return <Bell size={18} color="#64748b" />;
    }
  };

  return (
    <div className="notifs-page-root">
      <div className="container notifs-container">
        <LeftSidebar />
        <main className="notifs-main-content">
          <header className="notifs-header">
            <div className="notifs-header-left">
              <BackButton fallback="/feed" label="Back to Feed" />
              <div>
                <h1 className="notifs-title">Notifications</h1>
                <p className="notifs-subtitle">
                  Updates on your civic submissions, community discussions, and moderation notices.
                </p>
              </div>
            </div>

          {notifications.some((n) => !n.readAt) && (
            <button
              className="btn btn-outline btn-sm mark-all-btn"
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={16} />
              <span>Mark All as Read</span>
            </button>
          )}
        </header>

        <div className="notifs-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading your notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`notif-card ${!notif.readAt ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="notif-icon-bubble">
                  {getNotifIcon(notif.type)}
                </div>

                <div className="notif-content">
                  <p className="notif-message-text">{notif.message}</p>
                  <span className="notif-timestamp">
                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {!notif.readAt && <span className="unread-dot" />}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <Bell size={40} color="#94a3b8" />
              <h3>All caught up!</h3>
              <p>You have no notifications at this time.</p>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
