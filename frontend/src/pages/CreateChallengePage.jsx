import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Compass,
  Eye,
  FileText,
  Navigation,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './CreateChallengePage.css';

const CATEGORIES = [
  'Water Resources',
  'Healthcare',
  'Agriculture',
  'Sanitation',
  'Environment',
  'Infrastructure',
  'Energy',
  'Education',
  'Rural Livelihoods',
  'Accessibility',
  'Public Services',
  'Other',
];

const URGENCIES = [
  { val: 'low', label: 'Low', desc: 'Minor inconvenience, non-urgent' },
  { val: 'medium', label: 'Medium', desc: 'Moderate local impact, needs attention' },
  { val: 'high', label: 'High', desc: 'Severe disruption to village or ward' },
  { val: 'critical', label: 'Critical', desc: 'Life, health, or food security emergency' },
];

// Helper Leaflet Click Listener
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function CreateChallengePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/report');
    }
  }, [isAuthenticated, navigate]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Water Resources');
  const [urgency, setUrgency] = useState('medium');
  const [locationText, setLocationText] = useState('');
  const [coordinates, setCoordinates] = useState([23.3441, 85.3096]); // Ranchi, Jharkhand default [lat, lng]
  const [hasPickedCoords, setHasPickedCoords] = useState(false);
  const [affectedPeople, setAffectedPeople] = useState('');
  const [duration, setDuration] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [previewMode, setPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 5) {
      alert('You can upload a maximum of 5 evidence media files.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const f of selected) {
      if (f.size > 50 * 1024 * 1024) {
        alert(`File ${f.name} exceeds the 50MB limit.`);
        continue;
      }
      validFiles.push(f);
      newPreviews.push({
        url: URL.createObjectURL(f),
        type: f.type.startsWith('video/') ? 'video' : 'image',
        name: f.name,
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates([pos.coords.latitude, pos.coords.longitude]);
        setHasPickedCoords(true);
      },
      (err) => {
        alert(`Could not get location: ${err.message}`);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Detailed description must be at least 20 characters long.');
      return;
    }
    if (locationText.trim().length < 3) {
      setError('Please provide a specific location or district in Jharkhand.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('urgency', urgency);
      formData.append('locationText', locationText.trim());
      if (affectedPeople.trim()) formData.append('affectedPeople', affectedPeople.trim());
      if (duration.trim()) formData.append('duration', duration.trim());

      // GeoJSON standard: [longitude, latitude]
      if (coordinates) {
        formData.append(
          'coordinates',
          JSON.stringify([coordinates[1], coordinates[0]])
        );
      }

      files.forEach((file) => {
        formData.append('media', file);
      });

      const res = await apiRequest('/challenges', {
        method: 'POST',
        body: formData,
      });

      if (res.success && res.data?.challenge) {
        navigate(`/my-challenges?submitted=true`);
      }
    } catch (err) {
      setError(err.message || 'Submission failed. Please check required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-page-root">
      <div className="container create-container">
        <LeftSidebar />
        <main className="create-main-content">
          <div className="create-back-bar">
            <BackButton fallback="/feed" label="Back to Feed" />
          </div>
          <header className="create-header">
            <h1 className="create-title">Report a Civic Challenge</h1>
          <p className="create-subtitle">
            Document a societal problem affecting your village, ward, or district in Jharkhand. Submissions are reviewed by administrators before public discussion on JanFeed.
          </p>
        </header>

        {error && (
          <div className="create-error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form className="create-form" onSubmit={handleSubmit}>
          {/* 1. Title */}
          <div className="form-group">
            <label className="form-label">Challenge Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Broken Handpump and Arsenic Contamination in Udhwa Block"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* 2. Category & Urgency */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Category / Domain *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency Level *</label>
              <div className="urgency-chips-group">
                {URGENCIES.map((u) => (
                  <button
                    type="button"
                    key={u.val}
                    className={`urgency-choice-btn ${urgency === u.val ? 'active' : ''}`}
                    onClick={() => setUrgency(u.val)}
                  >
                    <span className={`badge badge-${u.val}`}>{u.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Detailed Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description * (min 20 chars)</label>
            <textarea
              className="form-textarea"
              placeholder="Describe what is happening on the ground, who is impacted, and what intervention is needed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* 4. Location Details */}
          <div className="form-group">
            <label className="form-label">Location Description *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Village Mandar, Ranchi District, Jharkhand"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              required
            />
          </div>

          {/* Interactive Map Coordinates Picker */}
          <div className="form-group">
            <div className="map-picker-header">
              <label className="form-label">
                Pin Location on Jharkhand Map (Optional but Recommended)
              </label>
              <button
                type="button"
                className="btn btn-outline btn-sm geo-btn"
                onClick={handleGetCurrentLocation}
              >
                <Navigation size={14} />
                <span>Use Current Location</span>
              </button>
            </div>
            <div className="map-picker-wrapper">
              <MapContainer
                center={coordinates}
                zoom={9}
                className="map-picker-element"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker
                  position={coordinates}
                  setPosition={(newPos) => {
                    setCoordinates(newPos);
                    setHasPickedCoords(true);
                  }}
                />
              </MapContainer>
            </div>
            <span className="map-hint">
              Click anywhere on the map to place a pin. Coordinates: Lat{' '}
              {coordinates[0].toFixed(4)}, Long {coordinates[1].toFixed(4)}
            </span>
          </div>

          {/* 5. Additional Context (Optional) */}
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Affected Population (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ~450 households, 3 primary schools"
                value={affectedPeople}
                onChange={(e) => setAffectedPeople(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration / Period (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Over the last 2 months"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          {/* 6. Evidence Upload */}
          <div className="form-group">
            <label className="form-label">Photographic & Video Evidence (Max 5 files)</label>
            <div className="upload-dropzone">
              <Upload size={32} className="upload-icon" />
              <p>Drag and drop or select photos and videos</p>
              <span className="upload-formats">
                Supports JPG, PNG, WEBP, MP4, WEBM (up to 50MB per file)
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="file-input-hidden"
                id="evidence-input"
              />
              <label htmlFor="evidence-input" className="btn btn-outline btn-sm">
                Browse Files
              </label>
            </div>

            {/* Media previews list */}
            {previews.length > 0 && (
              <div className="media-preview-list">
                {previews.map((item, idx) => (
                  <div key={idx} className="preview-item">
                    {item.type === 'video' ? (
                      <video src={item.url} className="preview-thumb" />
                    ) : (
                      <img src={item.url} alt={item.name} className="preview-thumb" />
                    )}
                    <button
                      type="button"
                      className="preview-remove-btn"
                      onClick={() => removeFile(idx)}
                      title="Remove media"
                    >
                      <X size={14} />
                    </button>
                    <span className="preview-name">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-action-row">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  <span>Submitting to JanSolve...</span>
                </>
              ) : (
                <span>Publish Civic Challenge</span>
              )}
            </button>
          </div>
        </form>
        </main>
      </div>
    </div>
  );
}
