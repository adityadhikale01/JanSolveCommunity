import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  ShieldCheck,
  Users,
  CheckCircle2,
  MapPin,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Flame,
  Camera,
  Activity,
  ArrowBigUp,
  Check,
  Eye,
  FileCheck2,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import ChallengeCard from '../components/ChallengeCard.jsx';
import './LandingPage.css';

const SHOWCASE_ITEMS = [
  {
    id: 1,
    category: 'Water Resources',
    title: 'Severe Groundwater Arsenic Levels in Drinking Wells Along Sahibganj Floodplains',
    location: 'Rajmahal & Udhwa, Sahibganj',
    votes: 52,
    discussions: 4,
    status: 'Verified',
    image: '/uploads/arsenic-handpump-sahibganj.jpg',
    excerpt: 'Community handpumps tested with 110 ppb arsenic. Safe filtration units deployed with Jal Jeevan Mission.',
    tag: '💧 Clean Water',
  },
  {
    id: 2,
    category: 'Energy',
    title: 'Unfinished Solar Mini-Grid Leaving 3 Remote Hamlets Without Evening Light in Latehar',
    location: 'Saryu & Garu Forest, Latehar',
    votes: 36,
    discussions: 3,
    status: 'Under Review',
    image: '/uploads/solar-grid-latehar.jpg',
    excerpt: 'Solar micro-grid poles erected in tribal forest blocks now receiving battery inverter repairs.',
    tag: '⚡ Clean Energy',
  },
  {
    id: 3,
    category: 'Healthcare',
    title: 'Lack of Point-of-Care Sickle Cell & Anemia Diagnostic Kits in Torpa PHC',
    location: 'Torpa Block, Khunti',
    votes: 68,
    discussions: 5,
    status: 'Verified',
    image: '/uploads/phc-clinic-khunti.jpg',
    excerpt: 'Tribal mothers and infants receiving on-site diagnostic screening support and hydroxyurea therapy.',
    tag: '🏥 Public Health',
  },
  {
    id: 4,
    category: 'Infrastructure',
    title: 'Collapsed Culvert and Submerged Earthen Embankment Cut Off 4 Panchayats in Barhi',
    location: 'Padma-Barhi Link, Hazaribagh',
    votes: 34,
    discussions: 2,
    status: 'Verified',
    image: '/uploads/broken-bridge-barhi.jpg',
    excerpt: 'Heavy floodwaters breached the masonry culvert. Bailey bridge requisition approved by RCD.',
    tag: '🛣️ Roads & Bridges',
  },
];

const CATEGORIES = [
  { name: 'Water Resources', icon: '💧', desc: 'Arsenic, fluoride, dry handpumps, check dams', count: '5 Reports' },
  { name: 'Healthcare', icon: '🏥', desc: 'PHC facilities, maternal health, sickle cell diagnosis', count: '4 Reports' },
  { name: 'Agriculture', icon: '🌾', desc: 'Crop pestilence, micro-irrigation, cold storage', count: '3 Reports' },
  { name: 'Sanitation', icon: '🧹', desc: 'Waste dumps, stormwater drainage, public toilets', count: '3 Reports' },
  { name: 'Environment', icon: '🌲', desc: 'Fugitive dust, mine runoff, forest conservation', count: '3 Reports' },
  { name: 'Infrastructure', icon: '🛣️', desc: 'Damaged culverts, rural roads, bridge connectivity', count: '3 Reports' },
  { name: 'Energy', icon: '⚡', desc: 'Solar micro-grids, rural electrification, transformer faults', count: '2 Reports' },
  { name: 'Education', icon: '📚', desc: 'Tribal school facilities, lab infrastructure, classrooms', count: '2 Reports' },
  { name: 'Rural Livelihoods', icon: '🧺', desc: 'Lac, tussar silk, minor forest produce, self-help groups', count: '2 Reports' },
  { name: 'Accessibility', icon: '♿', desc: 'Public building ramps, tactile pavements, station overpasses', count: '2 Reports' },
  { name: 'Public Services', icon: '🏛️', desc: 'PDS ration delivery, rural lighting, civic services', count: '2 Reports' },
  { name: 'Other', icon: '🔍', desc: 'Youth digital coaching, cyber awareness, community ideas', count: '2 Reports' },
];

const JHARKHAND_DISTRICTS = [
  'Ranchi', 'East Singhbhum', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar',
  'Palamu', 'Garhwa', 'Giridih', 'Dumka', 'Sahibganj', 'Pakur', 'Khunti',
  'Gumla', 'Simdega', 'West Singhbhum', 'Seraikela Kharsawan', 'Latehar',
  'Lohardaga', 'Ramgarh', 'Chatra', 'Koderma', 'Jamtara', 'Godda'
];

export default function LandingPage() {
  const [featuredChallenges, setFeaturedChallenges] = useState([]);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [stats, setStats] = useState({
    total: 29,
    verified: 17,
    districts: 24,
    discussions: 38,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const res = await apiRequest('/challenges?limit=4&sort=hot');
        if (res.success && res.data.challenges) {
          setFeaturedChallenges(res.data.challenges);
          setStats((prev) => ({
            ...prev,
            total: res.data.pagination?.total || 29,
          }));
        }
      } catch {
        // use fallback initial
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  // Auto-cycle showcase items every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveShowcaseIdx((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentShowcase = SHOWCASE_ITEMS[activeShowcaseIdx];

  return (
    <div className="landing-root">
      {/* 1. Hero Section with Interactive Split Layout & Ambient Animation */}
      <section className="landing-hero">
        <div className="hero-ambient-glow orb-1" />
        <div className="hero-ambient-glow orb-2" />

        <div className="container hero-container">
          <div className="hero-split-grid">
            {/* Left Column: Mission, Headlines & CTAs */}
            <div className="hero-left-content">
              <div className="hero-badge">
                <span className="badge-pulse-ring" />
                <span className="badge-text">
                  LIVE IN 24 DISTRICTS OF JHARKHAND
                </span>
              </div>

              <h1 className="hero-title">
                Where <span className="highlight-text">Jharkhand's Communities</span> Solve Real Challenges Together
              </h1>

              <p className="hero-description">
                The unified civic network: <strong>JanFeed</strong> provides a Reddit-style public forum with photographic and video evidence. <strong>JanSolve</strong> brings official administration verification, structured updates, and tracked resolution.
              </p>

              <div className="hero-cta-group">
                <Link to="/feed" className="btn btn-primary btn-lg hero-cta-btn">
                  <Flame size={20} />
                  <span>Explore JanFeed</span>
                </Link>
                <Link to="/report" className="btn btn-outline btn-lg hero-cta-btn">
                  <Camera size={19} />
                  <span>Report Community Problem</span>
                </Link>
                <Link to="/nearby" className="btn btn-subtle btn-lg hero-cta-btn">
                  <MapPin size={18} />
                  <span>Nearby Map</span>
                </Link>
              </div>

              {/* Live Metric Ticker */}
              <div className="hero-stats-bar">
                <div className="stat-item">
                  <span className="stat-number">{stats.districts}</span>
                  <span className="stat-label">Districts Active</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-number">{stats.total}+</span>
                  <span className="stat-label">Civic Issues Logged</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-number">{stats.verified}</span>
                  <span className="stat-label">Admin Verified</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Offline Media Evidence</span>
                </div>
              </div>
            </div>

            {/* Right Column: Animated Interactive Civic Showcase Widget */}
            <div className="hero-right-visual">
              {/* Showcase Tab Selector */}
              <div className="showcase-nav-pills">
                {SHOWCASE_ITEMS.map((item, idx) => (
                  <button
                    key={item.id}
                    className={`showcase-nav-pill ${
                      activeShowcaseIdx === idx ? 'active' : ''
                    }`}
                    onClick={() => setActiveShowcaseIdx(idx)}
                  >
                    <span>{item.tag}</span>
                  </button>
                ))}
              </div>

              {/* Main Floating Showcase Card */}
              <div className="showcase-card-wrapper">
                {/* Floating Badge: Top Right */}
                <div className="floating-badge badge-top-right">
                  <ShieldCheck size={16} color="#16a34a" />
                  <span>Admin Field Verified</span>
                </div>

                {/* Floating Badge: Bottom Left */}
                <div className="floating-badge badge-bottom-left">
                  <ArrowBigUp size={18} color="#ea580c" />
                  <span>{currentShowcase.votes} Citizen Upvotes</span>
                </div>

                <div className="showcase-card">
                  <div className="showcase-image-container">
                    <img
                      src={currentShowcase.image}
                      alt={currentShowcase.title}
                      className="showcase-image"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600';
                      }}
                    />
                    <div className="showcase-image-overlay">
                      <span className="showcase-location-chip">
                        <MapPin size={12} />
                        {currentShowcase.location}
                      </span>
                      <span className="showcase-category-badge">
                        {currentShowcase.category}
                      </span>
                    </div>
                  </div>

                  <div className="showcase-card-body">
                    <h3 className="showcase-card-title">
                      {currentShowcase.title}
                    </h3>
                    <p className="showcase-card-excerpt">
                      {currentShowcase.excerpt}
                    </p>

                    <div className="showcase-card-footer">
                      <div className="showcase-stats">
                        <span className="showcase-stat">
                          <ArrowBigUp size={16} /> {currentShowcase.votes} Upvotes
                        </span>
                        <span>•</span>
                        <span className="showcase-stat">
                          <MessageSquare size={14} /> {currentShowcase.discussions} Discussions
                        </span>
                      </div>

                      <Link
                        to="/feed"
                        className="btn btn-outline btn-sm btn-join-discussion"
                      >
                        <span>Join Discussion</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How JanSolve Works with Step Progress */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">A TRANSPARENT CIVIC LIFECYCLE</span>
            <h2 className="section-title">From Grassroots Report to Official Action</h2>
            <p className="section-subtitle">
              Bridging community voice with administrative accountability through clear stages.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-header">
                <div className="step-number-bubble">1</div>
                <div className="step-icon-wrap">
                  <Camera size={22} color="#16a34a" />
                </div>
              </div>
              <h3 className="step-title">Document with Evidence</h3>
              <p className="step-desc">
                Citizens submit on-ground community problems with geo-tagged photographs, video recordings, and GPS coordinates.
              </p>
            </div>

            <div className="step-card">
              <div className="step-header">
                <div className="step-number-bubble">2</div>
                <div className="step-icon-wrap">
                  <ShieldCheck size={22} color="#16a34a" />
                </div>
              </div>
              <h3 className="step-title">Administrative Inspection</h3>
              <p className="step-desc">
                JanSolve administrators inspect facts, request missing information, verify on-ground authenticity, and approve for publication.
              </p>
            </div>

            <div className="step-card">
              <div className="step-header">
                <div className="step-number-bubble">3</div>
                <div className="step-icon-wrap">
                  <MessageSquare size={22} color="#16a34a" />
                </div>
              </div>
              <h3 className="step-title">JanFeed Discussion</h3>
              <p className="step-desc">
                Approved issues go live on the Reddit-style community feed for citizen upvoting, comments, direct messaging, and neighborhood organizing.
              </p>
            </div>

            <div className="step-card">
              <div className="step-header">
                <div className="step-number-bubble">4</div>
                <div className="step-icon-wrap">
                  <CheckCircle2 size={22} color="#16a34a" />
                </div>
              </div>
              <h3 className="step-title">Verified Field Resolution</h3>
              <p className="step-desc">
                Authors and citizens receive real-time status notifications as local district departments resolve issues with audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Community Challenges */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-eyebrow">ACTIVE DISCUSSIONS</span>
              <h2 className="section-title">Trending Community Challenges</h2>
              <p className="section-subtitle">
                High-priority issues documented and supported by citizens across Jharkhand.
              </p>
            </div>
            <Link to="/explore" className="btn btn-outline btn-sm">
              <span>View All Issues ({stats.total})</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="featured-grid">
            {loading ? (
              <div className="loading-placeholder">
                <div className="spinner" />
                <p>Loading verified challenges...</p>
              </div>
            ) : featuredChallenges.length > 0 ? (
              featuredChallenges.map((challenge) => (
                <ChallengeCard key={challenge._id} challenge={challenge} />
              ))
            ) : (
              <p className="empty-text">No challenges published yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* 4. Category Discovery Grid */}
      <section className="categories-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">DISCOVER BY FOCUS AREA</span>
            <h2 className="section-title">Explore 12 Civic Domains</h2>
            <p className="section-subtitle">
              Targeted civic innovation across water, energy, health, agriculture, and public services.
            </p>
          </div>

          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/explore?category=${encodeURIComponent(cat.name)}`}
                className="category-card"
              >
                <div className="cat-card-top">
                  <div className="cat-icon-wrap">{cat.icon}</div>
                  <span className="cat-count-pill">{cat.count}</span>
                </div>
                <h4 className="cat-title">{cat.name}</h4>
                <p className="cat-desc">{cat.desc}</p>
                <div className="cat-card-footer">
                  <span>Browse Category</span>
                  <ArrowRight size={13} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Jharkhand Districts Spotlight */}
      <section className="districts-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-eyebrow">GEOGRAPHIC COVERAGE</span>
            <h2 className="section-title">Active Across All 24 Districts</h2>
            <p className="section-subtitle">
              Select your district to explore local community challenges, drinking water reports, and road infrastructure.
            </p>
          </div>

          <div className="districts-pill-container">
            {JHARKHAND_DISTRICTS.map((d) => (
              <Link
                key={d}
                to={`/explore?search=${encodeURIComponent(d)}`}
                className="district-pill"
              >
                <MapPin size={13} className="pin-icon" />
                <span>{d}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="landing-footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <div className="brand-logo">
              <span className="brand-icon">JS</span>
              <span className="brand-main">JanSolve</span>
            </div>
            <p className="footer-tagline">
              JanSolve connects communities, public challenges, and collective action through a shared civic platform.
            </p>
            <div className="footer-meta-badge">
              <ShieldCheck size={14} color="#16a34a" />
              <span>Official Civic Technology Infrastructure for Jharkhand</span>
            </div>
          </div>

          <div className="footer-nav-groups">
            <div className="footer-col">
              <h5>JanFeed Community</h5>
              <Link to="/feed">Community Feed</Link>
              <Link to="/explore">Explore Challenges</Link>
              <Link to="/nearby">Nearby District Map</Link>
              <Link to="/report">Report a Problem</Link>
            </div>
            <div className="footer-col">
              <h5>JanSolve Portal</h5>
              <Link to="/admin/login">Admin Review Portal</Link>
              <Link to="/about">About JanSolve</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Use</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container footer-bottom-container">
            <p>© {new Date().getFullYear()} JanSolve. Built for public good and civic empowerment in Jharkhand, India.</p>
            <div className="footer-bottom-links">
              <span>Ranchi</span>
              <span>•</span>
              <span>Dhanbad</span>
              <span>•</span>
              <span>Jamshedpur</span>
              <span>•</span>
              <span>Dumka</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
