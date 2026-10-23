import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  ArrowBigUp,
  ArrowBigDown,
  Share2,
  Bookmark,
  Flag,
  ShieldCheck,
  AlertTriangle,
  User,
  MessageSquare,
  Check,
  Send,
  CornerDownRight,
  Edit2,
  Trash2,
  AlertCircle,
  Eye,
  Info,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './ChallengeDetailPage.css';

// Fix Leaflet marker icon issue in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction states
  const [voteScore, setVoteScore] = useState(0);
  const [userVote, setUserVote] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: 'challenge', id });
  const [reportReason, setReportReason] = useState('Spam or Scam');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchChallengeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [chalRes, commRes] = await Promise.all([
        apiRequest(`/challenges/${id}`),
        apiRequest(`/challenges/${id}/comments`),
      ]);

      if (chalRes.success && chalRes.data?.challenge) {
        setChallenge(chalRes.data.challenge);
        setVoteScore(chalRes.data.challenge.voteScore || 0);
        setUserVote(chalRes.data.challenge.userVote || 0);
        setIsSaved(chalRes.data.challenge.isSaved || false);
      }

      if (commRes.success && commRes.data?.comments) {
        setComments(commRes.data.comments);
      }
    } catch (err) {
      setError(err.message || 'Challenge not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeData();
  }, [id]);

  const handleVote = async (val) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await apiRequest(`/challenges/${id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ value: val }),
      });
      if (res.success && res.data) {
        setVoteScore(res.data.voteScore);
        setUserVote(res.data.userVote);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await apiRequest(`/challenges/${id}/bookmark`, {
        method: 'POST',
      });
      if (res.success && res.data) {
        setIsSaved(res.data.isSaved);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: challenge.description.slice(0, 100),
          url,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;

    try {
      const res = await apiRequest(`/challenges/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.success && res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setCommentText('');
      }
    } catch (err) {
      alert(err.message || 'Could not post comment');
    }
  };

  const handlePostReply = async (parentCommentId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!replyText.trim()) return;

    try {
      const res = await apiRequest(`/challenges/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          body: replyText.trim(),
          parentComment: parentCommentId,
        }),
      });
      if (res.success && res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setReplyingTo(null);
        setReplyText('');
      }
    } catch (err) {
      alert(err.message || 'Could not post reply');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const res = await apiRequest(`/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ body: editText.trim() }),
      });
      if (res.success && res.data?.comment) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? res.data.comment : c))
        );
        setEditingCommentId(null);
        setEditText('');
      }
    } catch (err) {
      alert(err.message || 'Could not edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await apiRequest(`/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === commentId
              ? {
                  ...c,
                  body: '[This comment was deleted]',
                  isDeleted: true,
                }
              : c
          )
        );
      }
    } catch (err) {
      alert(err.message || 'Could not delete comment');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint =
        reportTarget.type === 'challenge'
          ? `/challenges/${reportTarget.id}/report`
          : `/comments/${reportTarget.id}/report`;

      await apiRequest(endpoint, {
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

  if (loading) {
    return (
      <div className="container detail-loading-screen">
        <div className="spinner" />
        <p>Loading civic challenge details...</p>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="container detail-error-screen">
        <AlertCircle size={40} color="#ef4444" />
        <h2>Challenge Unavailable</h2>
        <p>{error || 'This challenge may be private or removed.'}</p>
        <Link to="/explore" className="btn btn-primary btn-sm">
          Return to Explore
        </Link>
      </div>
    );
  }

  const isAuthor = user && challenge.author?._id === user._id;
  const hasCoordinates =
    challenge.coordinates &&
    challenge.coordinates.coordinates &&
    challenge.coordinates.coordinates.length === 2;

  // Hierarchical comments structure
  const topLevelComments = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) =>
    comments.filter(
      (c) =>
        c.parentComment &&
        (c.parentComment === parentId || c.parentComment._id === parentId)
    );

  return (
    <div className="detail-page-root">
      <div className="container detail-container">
        <LeftSidebar />
        {/* Main Article Content */}
        <div className="detail-main-column">
          <div className="detail-back-bar">
            <BackButton fallback="/explore" label="Back to Challenges" />
          </div>

          {/* Author notice banner if admin requested info or rejected */}
          {isAuthor && challenge.reviewNote && (
            <div
              className={`review-feedback-banner banner-${challenge.reviewStatus}`}
            >
              <Info size={20} />
              <div>
                <strong>
                  Administrator Feedback ({challenge.reviewStatus.replace('_', ' ')}):
                </strong>
                <p>{challenge.reviewNote}</p>
              </div>
            </div>
          )}

          {/* Article Header Card */}
          <article className="detail-card">
            <header className="detail-header">
              <div className="detail-author-row">
                <Link
                  to={`/profile/${challenge.author?._id}`}
                  className="detail-author-avatar-wrap"
                >
                  {challenge.author?.avatar ? (
                    <img
                      src={challenge.author.avatar}
                      alt={challenge.author.name}
                      className="detail-author-avatar"
                    />
                  ) : (
                    <div className="detail-author-placeholder">
                      {challenge.author?.name
                        ? challenge.author.name.charAt(0).toUpperCase()
                        : 'C'}
                    </div>
                  )}
                  <div>
                    <span className="detail-author-name">
                      {challenge.author?.name || 'Citizen'}
                    </span>
                    <span className="detail-author-loc">
                      {challenge.author?.location || 'Jharkhand'}
                    </span>
                  </div>
                </Link>

                {challenge.author?._id && challenge.author._id !== user?._id && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm btn-message-author"
                    onClick={() => {
                      if (!isAuthenticated) navigate('/login');
                      else navigate(`/messages?recipient=${challenge.author._id}`);
                    }}
                    title="Start private conversation with author"
                  >
                    <Send size={14} />
                    <span>Message Author</span>
                  </button>
                )}

                <div className="detail-badges-group">
                  <span className="badge badge-category">
                    {challenge.category}
                  </span>
                  <span className={`badge badge-${challenge.urgency}`}>
                    {challenge.urgency} urgency
                  </span>
                  <span className={`badge badge-${challenge.reviewStatus}`}>
                    {challenge.reviewStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <h1 className="detail-title">{challenge.title}</h1>

              <div className="detail-meta-bar">
                <span className="meta-item">
                  <MapPin size={15} />
                  {challenge.locationText}
                </span>
                <span>•</span>
                <span className="meta-item">
                  <Clock size={15} />
                  Reported on{' '}
                  {new Date(challenge.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span>•</span>
                <span className="meta-item">
                  <Eye size={15} />
                  {challenge.viewCount || 1} views
                </span>
              </div>
            </header>

            {/* Structured Impact Data */}
            {(challenge.affectedPeople || challenge.duration) && (
              <div className="impact-facts-box">
                {challenge.affectedPeople && (
                  <div className="fact-item">
                    <span className="fact-label">Affected Population:</span>
                    <span className="fact-value">{challenge.affectedPeople}</span>
                  </div>
                )}
                {challenge.duration && (
                  <div className="fact-item">
                    <span className="fact-label">Duration:</span>
                    <span className="fact-value">{challenge.duration}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description Body */}
            <div className="detail-description">
              <p>{challenge.description}</p>
            </div>

            {/* Evidence Gallery */}
            {challenge.evidence && challenge.evidence.length > 0 && (
              <section className="evidence-section">
                <h3 className="section-label">Evidence Media</h3>
                <div className="evidence-grid">
                  {challenge.evidence.map((media, idx) => (
                    <div key={idx} className="evidence-item">
                      {media.fileType === 'video' ? (
                        <video
                          src={media.url}
                          controls
                          className="evidence-video"
                        />
                      ) : (
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noreferrer"
                          className="evidence-img-link"
                        >
                          <img
                            src={media.url}
                            alt={`Evidence ${idx + 1}`}
                            className="evidence-img"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Location Map if coordinates available */}
            {hasCoordinates && (
              <section className="map-evidence-section">
                <h3 className="section-label">Location Coordinates</h3>
                <div className="map-view-wrapper">
                  <MapContainer
                    center={[
                      challenge.coordinates.coordinates[1],
                      challenge.coordinates.coordinates[0],
                    ]}
                    zoom={12}
                    scrollWheelZoom={false}
                    className="leaflet-detail-map"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[
                        challenge.coordinates.coordinates[1],
                        challenge.coordinates.coordinates[0],
                      ]}
                    >
                      <Popup>
                        <strong>{challenge.title}</strong>
                        <p>{challenge.locationText}</p>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </section>
            )}

            {/* Interaction Bar */}
            <footer className="detail-action-bar">
              <div className="detail-vote-group">
                <button
                  className={`vote-btn-lg upvote ${userVote === 1 ? 'active' : ''}`}
                  onClick={() => handleVote(1)}
                  title="Upvote"
                >
                  <ArrowBigUp size={24} />
                  <span>Upvote</span>
                </button>
                <span className="detail-vote-score">{voteScore}</span>
                <button
                  className={`vote-btn-lg downvote ${userVote === -1 ? 'active' : ''}`}
                  onClick={() => handleVote(-1)}
                  title="Downvote"
                >
                  <ArrowBigDown size={24} />
                </button>
              </div>

              <div className="detail-tools-group">
                <button
                  className={`btn btn-outline btn-sm ${copied ? 'copied' : ''}`}
                  onClick={handleShare}
                >
                  {copied ? <Check size={16} /> : <Share2 size={16} />}
                  <span>{copied ? 'Copied' : 'Share'}</span>
                </button>

                <button
                  className={`btn btn-outline btn-sm ${isSaved ? 'btn-saved' : ''}`}
                  onClick={handleBookmark}
                >
                  <Bookmark size={16} className={isSaved ? 'fill-current' : ''} />
                  <span>{isSaved ? 'Saved' : 'Bookmark'}</span>
                </button>

                <button
                  className="btn btn-outline btn-sm btn-report-tool"
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else {
                      setReportTarget({ type: 'challenge', id });
                      setShowReportModal(true);
                    }
                  }}
                >
                  <Flag size={16} />
                  <span>Report</span>
                </button>
              </div>
            </footer>
          </article>

          {/* ========================================================
              COMMUNITY DISCUSSION & COMMENTS SECTION
             ======================================================== */}
          <section className="comments-section" id="comments">
            <div className="comments-header">
              <MessageSquare size={22} className="comment-header-icon" />
              <h3>Community Discussion ({comments.length})</h3>
            </div>

            {/* Comment Composer */}
            <form className="comment-composer-form" onSubmit={handlePostComment}>
              <textarea
                className="form-textarea comment-input"
                placeholder={
                  isAuthenticated
                    ? 'Share your insights, field data, or solutions for this issue...'
                    : 'Please log in to participate in the community discussion.'
                }
                disabled={!isAuthenticated}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="composer-actions">
                <button
                  type="submit"
                  disabled={!isAuthenticated || !commentText.trim()}
                  className="btn btn-primary btn-sm"
                >
                  <Send size={15} />
                  <span>Post Comment</span>
                </button>
              </div>
            </form>

            {/* Comments Tree */}
            <div className="comments-list">
              {topLevelComments.length > 0 ? (
                topLevelComments.map((comment) => (
                  <div key={comment._id} className="comment-thread">
                    <CommentCard
                      comment={comment}
                      currentUser={user}
                      onReply={() => {
                        setReplyingTo(comment._id);
                        setReplyText('');
                      }}
                      onEdit={() => {
                        setEditingCommentId(comment._id);
                        setEditText(comment.body);
                      }}
                      onDelete={() => handleDeleteComment(comment._id)}
                      onReport={() => {
                        if (!isAuthenticated) navigate('/login');
                        else {
                          setReportTarget({ type: 'comment', id: comment._id });
                          setShowReportModal(true);
                        }
                      }}
                    />

                    {/* Inline Edit Form */}
                    {editingCommentId === comment._id && (
                      <div className="comment-edit-box">
                        <textarea
                          className="form-textarea"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <div className="composer-actions">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateComment(comment._id)}
                          >
                            Save Edit
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Reply Form */}
                    {replyingTo === comment._id && (
                      <div className="comment-reply-box">
                        <textarea
                          className="form-textarea"
                          placeholder="Write a constructive reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className="composer-actions">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setReplyingTo(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handlePostReply(comment._id)}
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies */}
                    <div className="nested-replies-list">
                      {getReplies(comment._id).map((reply) => (
                        <div key={reply._id} className="nested-reply-wrap">
                          <CornerDownRight size={16} className="reply-arrow" />
                          <div className="reply-content-box">
                            <CommentCard
                              comment={reply}
                              currentUser={user}
                              onEdit={() => {
                                setEditingCommentId(reply._id);
                                setEditText(reply.body);
                              }}
                              onDelete={() => handleDeleteComment(reply._id)}
                              onReport={() => {
                                if (!isAuthenticated) navigate('/login');
                                else {
                                  setReportTarget({
                                    type: 'comment',
                                    id: reply._id,
                                  });
                                  setShowReportModal(true);
                                }
                              }}
                            />
                            {editingCommentId === reply._id && (
                              <div className="comment-edit-box">
                                <textarea
                                  className="form-textarea"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                />
                                <div className="composer-actions">
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setEditingCommentId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleUpdateComment(reply._id)}
                                  >
                                    Save Edit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-comments-state">
                  <p>No community comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Global Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Report {reportTarget.type === 'challenge' ? 'Challenge' : 'Comment'}
              </h3>
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
                <p>Report queued for moderation. Thank you for your vigilance.</p>
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
                  <label className="form-label">Explanation</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide details..."
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
    </div>
  );
}

// Sub-component for individual comments
function CommentCard({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReport,
}) {
  const isAuthor =
    currentUser &&
    (comment.author?._id === currentUser._id ||
      comment.author === currentUser._id);

  return (
    <div className={`comment-card ${comment.isDeleted ? 'deleted-comment' : ''}`}>
      <div className="comment-header-row">
        <div className="comment-author-badge">
          {comment.author?.avatar ? (
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className="comment-avatar"
            />
          ) : (
            <div className="comment-avatar-placeholder">
              {comment.author?.name
                ? comment.author.name.charAt(0).toUpperCase()
                : 'C'}
            </div>
          )}
          <span className="comment-author-name">
            {comment.author?.name || 'Citizen'}
          </span>
          <span className="comment-timestamp">
            {new Date(comment.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="comment-actions-menu">
          {!comment.isDeleted && (
            <>
              {onReply && (
                <button
                  className="comment-action-btn"
                  onClick={onReply}
                  title="Reply"
                >
                  Reply
                </button>
              )}
              {isAuthor && (
                <>
                  <button
                    className="comment-action-btn"
                    onClick={onEdit}
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="comment-action-btn delete-btn"
                    onClick={onDelete}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
              <button
                className="comment-action-btn report-btn"
                onClick={onReport}
                title="Report"
              >
                <Flag size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="comment-body-text">
        <p>{comment.body}</p>
      </div>
    </div>
  );
}
