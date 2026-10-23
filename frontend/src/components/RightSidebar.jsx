import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { apiRequest } from '../services/api.js';
import './RightSidebar.css';

const TRENDING_CATEGORIES = [
  'Water Resources',
  'Healthcare',
  'Agriculture',
  'Sanitation',
  'Infrastructure',
  'Environment',
];

export default function RightSidebar() {
  const [stats, setStats] = useState({
    totalChallenges: 6,
    verified: 3,
    published: 4,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiRequest('/challenges?limit=1');
        if (res.success && res.data.pagination) {
          setStats((prev) => ({
            ...prev,
            published: res.data.pagination.total,
          }));
        }
      } catch {
        // use fallback initial
      }
    };
    fetchStats();
  }, []);

  return (
    <aside className="right-sidebar">
      {/* Jharkhand Mission Card */}
      <div className="sidebar-card mission-card">
        <div className="card-header-icon">
          <ShieldCheck size={22} className="mission-icon" />
          <h3 className="card-title">Jharkhand Civic Action</h3>
        </div>
        <p className="card-text">
          JanSolve empowers citizens across all 24 districts of Jharkhand to
          document local societal problems, build community consensus, and drive
          verified administrative resolution.
        </p>
        <Link to="/report" className="btn btn-primary btn-sm full-width-btn">
          Report Issue in Your District
        </Link>
      </div>

      {/* Trending Categories */}
      <div className="sidebar-card">
        <div className="card-header-icon">
          <TrendingUp size={18} className="trend-icon" />
          <h4 className="card-title-sm">Trending Categories</h4>
        </div>
        <div className="category-tags-list">
          {TRENDING_CATEGORIES.map((cat) => (
            <Link
              key={cat}
              to={`/explore?category=${encodeURIComponent(cat)}`}
              className="cat-pill-link"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="sidebar-card guidelines-card">
        <div className="card-header-icon">
          <Info size={18} className="info-icon" />
          <h4 className="card-title-sm">Community Guidelines</h4>
        </div>
        <ul className="guidelines-list">
          <li>Provide accurate on-ground facts & district details.</li>
          <li>Attach authentic photographic or video evidence.</li>
          <li>Engage constructively in solutions discussion.</li>
          <li>No personal attacks or defamatory statements.</li>
        </ul>
      </div>

      {/* Policy and About Links */}
      <footer className="sidebar-footer">
        <div className="footer-links">
          <Link to="/about">About JanSolve</Link>
          <span>•</span>
          <Link to="/privacy">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms">Terms of Service</Link>
        </div>
        <p className="copyright-text">
          © {new Date().getFullYear()} JanSolve Platform • Made for Jharkhand
        </p>
      </footer>
    </aside>
  );
}
