import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  EyeOff,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { apiRequest } from '../../services/api.js';
import BackButton from '../../components/BackButton.jsx';
import './AdminPages.css';

export default function AdminChallengeReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action form state
  const [actionType, setActionType] = useState(null); // 'review' | 'publish'
  const [targetReviewStatus, setTargetReviewStatus] = useState('');
  const [targetPubStatus, setTargetPubStatus] = useState('');
  const [note, setNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const fetchChallengeData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/admin/challenges/${id}`);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Challenge not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallengeData();
  }, [id]);

  const handleReviewAction = async (newStatus) => {
    if (newStatus === 'rejected' || newStatus === 'information_requested') {
      if (!note.trim()) {
        alert('A review note explaining this decision to the author is required.');
        return;
      }
    }

    setSubmittingAction(true);
    try {
      const res = await apiRequest(`/admin/challenges/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          reviewStatus: newStatus,
          reviewNote: note.trim(),
        }),
      });

      if (res.success && res.data?.challenge) {
        setActionSuccessMsg(`Status updated to ${newStatus}`);
        setNote('');
        fetchChallengeData();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePublicationAction = async (pubStatus) => {
    setSubmittingAction(true);
    try {
      const res = await apiRequest(`/admin/challenges/${id}/publication`, {
        method: 'PATCH',
        body: JSON.stringify({
          publicationStatus: pubStatus,
          note: note.trim(),
        }),
      });

      if (res.success && res.data?.challenge) {
        setActionSuccessMsg(`JanFeed publication updated to ${pubStatus}`);
        setNote('');
        fetchChallengeData();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert(err.message || 'Publication change failed');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-panel">
        <div className="spinner" />
        <p>Loading full submission details and audit log...</p>
      </div>
    );
  }

  if (error || !data?.challenge) {
    return (
      <div className="admin-empty-table">
        <AlertTriangle size={36} color="#ef4444" />
        <h3>Challenge Record Not Found</h3>
        <p>{error}</p>
        <Link to="/admin/challenges" className="btn btn-primary btn-sm">
          Return to Management
        </Link>
      </div>
    );
  }

  const { challenge, auditHistory = [] } = data;
  const hasCoordinates =
    challenge.coordinates?.coordinates &&
    challenge.coordinates.coordinates.length === 2;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div className="review-header-title">
          <BackButton fallback="/admin/challenges" label="Back to Challenges" />
          <h1 className="admin-h1">{challenge.title}</h1>
        </div>

        <div className="review-status-pills">
          <span className={`badge badge-${challenge.urgency}`}>
            {challenge.urgency} urgency
          </span>
          <span className={`badge badge-${challenge.reviewStatus}`}>
            Review: {challenge.reviewStatus.replace('_', ' ')}
          </span>
          <span className={`badge badge-${challenge.publicationStatus}`}>
            Feed: {challenge.publicationStatus}
          </span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="admin-action-success-banner">
          <CheckCircle2 size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 2-Column Review Canvas */}
      <div className="admin-review-grid">
        {/* Left Column: Challenge Content, Evidence, Author Details */}
        <div className="review-left-col">
          {/* Overview Card */}
          <div className="admin-panel-card">
            <h3 className="panel-card-title">Problem Statement</h3>
            <p className="review-description-text">{challenge.description}</p>

            <div className="review-meta-facts-grid">
              <div className="meta-fact">
                <span className="fact-label">Category / Domain</span>
                <span className="fact-value">{challenge.category}</span>
              </div>
              <div className="meta-fact">
                <span className="fact-label">Location / Address</span>
                <span className="fact-value">{challenge.locationText}</span>
              </div>
              <div className="meta-fact">
                <span className="fact-label">Affected Population</span>
                <span className="fact-value">
                  {challenge.affectedPeople || 'Unspecified'}
                </span>
              </div>
              <div className="meta-fact">
                <span className="fact-label">Duration of Issue</span>
                <span className="fact-value">
                  {challenge.duration || 'Unspecified'}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Media Card */}
          <div className="admin-panel-card">
            <h3 className="panel-card-title">
              Uploaded Evidence Media ({challenge.evidence?.length || 0})
            </h3>
            {challenge.evidence && challenge.evidence.length > 0 ? (
              <div className="review-evidence-grid">
                {challenge.evidence.map((media, idx) => (
                  <div key={idx} className="review-evidence-item">
                    {media.fileType === 'video' ? (
                      <video src={media.url} controls className="review-video" />
                    ) : (
                      <a href={media.url} target="_blank" rel="noreferrer">
                        <img
                          src={media.url}
                          alt={`Evidence ${idx + 1}`}
                          className="review-img"
                        />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data-hint">No photographic or video evidence attached.</p>
            )}
          </div>

          {/* Map Location Card */}
          {hasCoordinates && (
            <div className="admin-panel-card">
              <h3 className="panel-card-title">Geographic Coordinates</h3>
              <div className="review-map-wrap">
                <MapContainer
                  center={[
                    challenge.coordinates.coordinates[1],
                    challenge.coordinates.coordinates[0],
                  ]}
                  zoom={12}
                  className="leaflet-review-map"
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
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <span className="coords-readout">
                [Longitude: {challenge.coordinates.coordinates[0]}, Latitude:{' '}
                {challenge.coordinates.coordinates[1]}]
              </span>
            </div>
          )}

          {/* Author Details Card */}
          <div className="admin-panel-card">
            <h3 className="panel-card-title">Submitting Citizen Account</h3>
            <div className="review-author-card">
              <div className="author-card-avatar">
                {challenge.author?.name ? challenge.author.name.charAt(0) : 'C'}
              </div>
              <div className="author-card-info">
                <strong>{challenge.author?.name || 'Citizen'}</strong>
                <span>{challenge.author?.email}</span>
                <span>Location: {challenge.author?.location || 'Jharkhand'}</span>
                <span>
                  Member since:{' '}
                  {new Date(challenge.author?.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Administrative Decision Panel & Audit History */}
        <div className="review-right-col">
          {/* Action Decision Panel */}
          <div className="admin-panel-card action-decision-card">
            <h3 className="panel-card-title">Administrative Actions</h3>

            {/* Note input */}
            <div className="form-group">
              <label className="form-label">
                Decision Note / Feedback to Author (Required for Reject & Request Info)
              </label>
              <textarea
                className="form-textarea admin-note-input"
                placeholder="Write specific feedback, reasons, or requests for more evidence..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="action-buttons-group">
              {/* Approve & Publish */}
              <button
                type="button"
                disabled={submittingAction}
                className="btn btn-primary full-btn"
                onClick={() => handlePublicationAction('published')}
              >
                <ShieldCheck size={16} />
                <span>Approve & Publish to JanFeed</span>
              </button>

              {/* Verify Issue */}
              <button
                type="button"
                disabled={submittingAction}
                className="btn btn-outline full-btn btn-verify"
                onClick={() => handleReviewAction('verified')}
              >
                <CheckCircle2 size={16} />
                <span>Verify Reported Issue On-Ground</span>
              </button>

              {/* Request More Information */}
              <button
                type="button"
                disabled={submittingAction}
                className="btn btn-outline full-btn btn-info-req"
                onClick={() => handleReviewAction('information_requested')}
              >
                <HelpCircle size={16} />
                <span>Request Additional Information</span>
              </button>

              {/* Reject */}
              <button
                type="button"
                disabled={submittingAction}
                className="btn btn-danger full-btn"
                onClick={() => handleReviewAction('rejected')}
              >
                <XCircle size={16} />
                <span>Reject Submission</span>
              </button>

              {/* Remove Published if already published */}
              {challenge.publicationStatus === 'published' && (
                <button
                  type="button"
                  disabled={submittingAction}
                  className="btn btn-outline full-btn btn-remove-feed"
                  onClick={() => handlePublicationAction('removed')}
                >
                  <EyeOff size={16} />
                  <span>Remove from Public Feed</span>
                </button>
              )}
            </div>
          </div>

          {/* Audit Trail */}
          <div className="admin-panel-card">
            <div className="panel-header-row">
              <History size={16} />
              <h3 className="panel-card-title">Decision Audit Trail</h3>
            </div>

            <div className="audit-timeline">
              {auditHistory.length > 0 ? (
                auditHistory.map((item) => (
                  <div key={item._id} className="audit-timeline-item">
                    <span className="audit-action-tag">{item.action}</span>
                    <span className="audit-actor">
                      By {item.actor?.name || 'Administrator'}
                    </span>
                    {item.metadata?.note && (
                      <p className="audit-note">"{item.metadata.note}"</p>
                    )}
                    <span className="audit-timestamp">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-data-hint">No prior review actions recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
