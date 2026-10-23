import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Check,
  Flag,
  Film,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import './ChallengeCard.css';

export default function ChallengeCard({ challenge, onVoteChange }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [voteScore, setVoteScore] = useState(challenge.voteScore || 0);
  const [userVote, setUserVote] = useState(challenge.userVote || 0);
  const [isSaved, setIsSaved] = useState(challenge.isSaved || false);
  const [copied, setCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Duplicate Submission');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Voting handler
  const handleVote = async (value) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await apiRequest(`/challenges/${challenge._id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ value }),
      });

      if (res.success && res.data) {
        setVoteScore(res.data.voteScore);
        setUserVote(res.data.userVote);
        if (onVoteChange) {
          onVoteChange(challenge._id, res.data.voteScore, res.data.userVote);
        }
      }
    } catch (err) {
      console.error('Failed to register vote:', err.message);
    }
  };

  // Bookmark handler
  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const res = await apiRequest(`/challenges/${challenge._id}/bookmark`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        setIsSaved(res.data.isSaved);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err.message);
    }
  };

  // Share handler
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/challenges/${challenge._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: challenge.description.slice(0, 100),
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Report handler
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/challenges/${challenge._id}/report`, {
        method: 'POST',
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setShowReportModal(false);
      }, 1500);
    } catch (err) {
      alert(err.message || 'Report could not be sent.');
    }
  };

  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const hasMedia = challenge.evidence && challenge.evidence.length > 0;
  const firstMedia = hasMedia ? challenge.evidence[0] : null;

  return (
    <article className="post-card">
      {/* 1. Reddit-style Vote Gutter (Left) */}
      <div className="vote-gutter">
        <button
          className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
          onClick={() => handleVote(1)}
          aria-label="Upvote challenge"
          title="Upvote (Support issue)"
        >
          <ArrowBigUp size={24} />
        </button>

        <span className={`vote-count ${userVote !== 0 ? 'voted' : ''}`}>
          {voteScore}
        </span>

        <button
          className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
          onClick={() => handleVote(-1)}
          aria-label="Downvote challenge"
          title="Downvote"
        >
          <ArrowBigDown size={24} />
        </button>
      </div>

      {/* 2. Main Post Content */}
      <div className="post-body">
        {/* Header Metadata */}
        <header className="post-header">
          <div className="author-info">
            {challenge.author?.avatar ? (
              <img
                src={challenge.author.avatar}
                alt={challenge.author.name}
                className="author-avatar"
              />
            ) : (
              <div className="author-placeholder">
                {challenge.author?.name
                  ? challenge.author.name.charAt(0).toUpperCase()
                  : 'C'}
              </div>
            )}
            <div className="author-meta">
              <Link
                to={`/profile/${challenge.author?._id || ''}`}
                className="author-name"
              >
                {challenge.author?.name || 'Citizen'}
              </Link>
              <div className="post-meta-sub">
                <span className="location-pill">
                  <MapPin size={12} />
                  {challenge.locationText || 'Jharkhand'}
                </span>
                <span>•</span>
                <span className="post-time">
                  <Clock size={12} />
                  {formatDate(challenge.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="post-badges">
            <span className="badge badge-category">{challenge.category}</span>
            <span className={`badge badge-${challenge.urgency}`}>
              {challenge.urgency}
            </span>
            {challenge.reviewStatus === 'verified' && (
              <span className="badge badge-verified" title="Verified by Administration">
                <ShieldCheck size={12} /> Verified
              </span>
            )}
          </div>
        </header>

        {/* Title */}
        <h2 className="post-title">
          <Link to={`/challenges/${challenge._id}`}>{challenge.title}</Link>
        </h2>

        {/* Description Snippet */}
        <p className="post-snippet">{challenge.description}</p>

        {/* Media Preview (Photo / Video thumbnail) */}
        {hasMedia && firstMedia && (
          <div className="post-media-preview">
            {firstMedia.fileType === 'video' ? (
              <div className="video-preview-wrapper">
                <video
                  src={firstMedia.url}
                  preload="metadata"
                  controls
                  className="card-video-element"
                />
              </div>
            ) : (
              <Link to={`/challenges/${challenge._id}`} className="image-preview-link">
                <img
                  src={firstMedia.url}
                  alt={challenge.title}
                  loading="lazy"
                  className="card-image-element"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Link>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <footer className="post-footer">
          <Link
            to={`/challenges/${challenge._id}#comments`}
            className="action-btn comment-btn"
          >
            <MessageSquare size={17} />
            <span>{challenge.commentCount || 0} Discussions</span>
          </Link>

          <button
            className={`action-btn share-btn ${copied ? 'copied' : ''}`}
            onClick={handleShare}
            title="Share challenge"
          >
            {copied ? <Check size={17} /> : <Share2 size={17} />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            className={`action-btn bookmark-btn ${isSaved ? 'saved' : ''}`}
            onClick={handleBookmark}
            title={isSaved ? 'Remove Bookmark' : 'Save for later'}
          >
            <Bookmark size={17} className={isSaved ? 'fill-current' : ''} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          {challenge.author?._id && challenge.author._id !== user?._id && (
            <button
              className="action-btn message-author-btn"
              onClick={() => {
                if (!isAuthenticated) navigate('/login');
                else navigate(`/messages?recipient=${challenge.author._id}`);
              }}
              title={`Message ${challenge.author?.name || 'Citizen'}`}
            >
              <Send size={15} />
              <span className="hide-mobile">Message</span>
            </button>
          )}

          <button
            className="action-btn report-btn"
            onClick={() => {
              if (!isAuthenticated) navigate('/login');
              else setShowReportModal(true);
            }}
            title="Report inappropriate content"
          >
            <Flag size={15} />
            <span className="hide-mobile">Report</span>
          </button>
        </footer>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Report Civic Challenge</h3>
              <button
                className="btn-close"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>
            {reportSuccess ? (
              <div className="report-success-message">
                <Check size={32} color="#16a34a" />
                <p>Report submitted to moderators. Thank you!</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit}>
                <div className="form-group">
                  <label className="form-label">Reason for Report</label>
                  <select
                    className="form-select"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  >
                    <option value="Duplicate Submission">Duplicate Submission</option>
                    <option value="False or Misleading Information">
                      False or Misleading Information
                    </option>
                    <option value="Hate Speech or Harassment">
                      Hate Speech or Harassment
                    </option>
                    <option value="Spam or Scam">Spam or Scam</option>
                    <option value="Inappropriate or Explicit Media">
                      Inappropriate or Explicit Media
                    </option>
                    <option value="Safety Hazard or Violence">
                      Safety Hazard or Violence
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Additional Context (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide details for the moderation team..."
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowReportModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
