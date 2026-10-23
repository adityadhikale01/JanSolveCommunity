import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Filter,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  List,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import LeftSidebar from '../components/LeftSidebar.jsx';
import BackButton from '../components/BackButton.jsx';
import './NearbyMapPage.css';

const CATEGORIES = [
  'All',
  'Water Resources',
  'Healthcare',
  'Agriculture',
  'Sanitation',
  'Environment',
  'Infrastructure',
  'Energy',
];

// Helper to center map dynamically
function SetMapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 9);
    }
  }, [center, zoom, map]);
  return null;
}

export default function NearbyMapPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.6102, 85.2799]); // Jharkhand centroid
  const [mapZoom, setMapZoom] = useState(8);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showDrawer, setShowDrawer] = useState(true);

  const fetchNearby = async (lat = null, lng = null) => {
    setLoading(true);
    try {
      let query = '/challenges/nearby?radiusKm=200';
      if (selectedCategory !== 'All') {
        query += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (lat && lng) {
        query += `&lat=${lat}&lng=${lng}`;
      }

      const res = await apiRequest(query);
      if (res.success && res.data?.challenges) {
        setChallenges(res.data.challenges);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearby(userLocation?.lat, userLocation?.lng);
  }, [selectedCategory]);

  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setMapCenter([coords.lat, coords.lng]);
        setMapZoom(11);
        fetchNearby(coords.lat, coords.lng);
      },
      (err) => {
        alert(
          'Could not retrieve your location. Using default Jharkhand map view.'
        );
      }
    );
  };

  return (
    <div className="nearby-map-root">
      <div className="container nearby-page-layout">
        <LeftSidebar />
        <div className="nearby-main-card">
          {/* Top Controls Toolbar */}
          <div className="map-toolbar">
            <div className="toolbar-left">
              <BackButton fallback="/feed" label="Back to Feed" />
              <h2 className="toolbar-title">Nearby Civic Issues Map</h2>
              <span className="count-badge">
                {challenges.length} Mapped Across Jharkhand
              </span>
            </div>

        <div className="toolbar-actions">
          {/* Category Filter */}
          <div className="cat-filter-select-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Domains' : c}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-outline btn-sm locate-me-btn"
            onClick={handleLocateUser}
          >
            <Navigation size={14} />
            <span>Near Me</span>
          </button>

          <button
            className={`btn btn-outline btn-sm drawer-toggle-btn ${
              showDrawer ? 'active' : ''
            }`}
            onClick={() => setShowDrawer(!showDrawer)}
          >
            <List size={15} />
            <span className="hide-mobile">
              {showDrawer ? 'Hide List' : 'Show List'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Map & Drawer Area */}
      <div className="map-content-area">
        <div className="map-container-wrapper">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="leaflet-full-map"
          >
            <SetMapCenter center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* User marker if available */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <strong>You are here</strong>
                </Popup>
              </Marker>
            )}

            {/* Challenge markers */}
            {challenges.map((c) => {
              if (
                !c.coordinates ||
                !c.coordinates.coordinates ||
                c.coordinates.coordinates.length !== 2
              ) {
                return null;
              }
              const [lng, lat] = c.coordinates.coordinates;

              return (
                <Marker
                  key={c._id}
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => setSelectedChallenge(c),
                  }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <span className="badge badge-category">{c.category}</span>
                      <h4 className="popup-title">{c.title}</h4>
                      <p className="popup-loc">
                        <MapPin size={12} />
                        {c.locationText}
                      </p>
                      <Link
                        to={`/challenges/${c._id}`}
                        className="btn btn-primary btn-sm popup-link"
                      >
                        <span>View Details</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Side Drawer List */}
        {showDrawer && (
          <aside className="map-side-drawer">
            <div className="drawer-header">
              <h3>Issues in this View</h3>
              <span>{challenges.length} Results</span>
            </div>

            <div className="drawer-list">
              {challenges.length > 0 ? (
                challenges.map((c) => (
                  <div
                    key={c._id}
                    className={`drawer-card ${
                      selectedChallenge?._id === c._id ? 'selected' : ''
                    }`}
                    onClick={() => {
                      if (c.coordinates?.coordinates) {
                        setMapCenter([
                          c.coordinates.coordinates[1],
                          c.coordinates.coordinates[0],
                        ]);
                        setMapZoom(13);
                      }
                      setSelectedChallenge(c);
                    }}
                  >
                    <div className="drawer-card-top">
                      <span className="badge badge-category">{c.category}</span>
                      <span className={`badge badge-${c.urgency}`}>
                        {c.urgency}
                      </span>
                    </div>
                    <h4 className="drawer-card-title">{c.title}</h4>
                    <span className="drawer-card-loc">
                      <MapPin size={12} />
                      {c.locationText}
                    </span>
                    <Link
                      to={`/challenges/${c._id}`}
                      className="drawer-action-link"
                    >
                      View Issue →
                    </Link>
                  </div>
                ))
              ) : (
                <p className="drawer-empty-text">
                  No challenges with coordinates in this category.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
      </div>
    </div>
  </div>
);
}
