import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Grid,
  List,
  Flame,
  Clock,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import LeftSidebar from '../components/LeftSidebar.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import BackButton from '../components/BackButton.jsx';
import './ExplorePage.css';

const CATEGORIES = [
  'All',
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

const URGENCIES = ['All', 'low', 'medium', 'high', 'critical'];

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isGridView, setIsGridView] = useState(false);

  const searchInput = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedUrgency = searchParams.get('urgency') || 'All';
  const selectedSort = searchParams.get('sort') || 'hot';

  const [term, setTerm] = useState(searchInput);

  const fetchChallenges = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: p,
        limit: 12,
        sort: selectedSort,
      });

      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedUrgency !== 'All') params.append('urgency', selectedUrgency);
      if (searchInput) params.append('search', searchInput);

      const res = await apiRequest(`/challenges?${params.toString()}`);
      if (res.success && res.data) {
        setChallenges(res.data.challenges);
        setTotalCount(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages || 1);
        setPage(p);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges(1);
  }, [selectedCategory, selectedUrgency, selectedSort, searchInput]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (term.trim()) next.set('search', term.trim());
    else next.delete('search');
    setSearchParams(next);
  };

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'All') next.delete(key);
    else next.set(key, val);
    setSearchParams(next);
  };

  return (
    <div className="explore-page-root">
      <div className="container explore-container">
        <LeftSidebar />
        <main className="explore-main-content">
          {/* Page Header */}
          <header className="explore-header">
          <div className="explore-header-left">
            <BackButton fallback="/feed" label="Back to Feed" />
            <div>
              <h1 className="explore-title">Explore Civic Challenges</h1>
              <p className="explore-subtitle">
                Browse, filter, and discover community problem reports across Jharkhand.
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div className="view-toggle-btns">
            <button
              className={`view-btn ${!isGridView ? 'active' : ''}`}
              onClick={() => setIsGridView(false)}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              className={`view-btn ${isGridView ? 'active' : ''}`}
              onClick={() => setIsGridView(true)}
              title="Grid View"
            >
              <Grid size={18} />
            </button>
          </div>
        </header>

        {/* Filter Controls Bar */}
        <div className="explore-filter-panel">
          <form className="explore-search-form" onSubmit={handleSearchSubmit}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by issue title, block, or keywords..."
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Search
            </button>
          </form>

          <div className="filter-dropdowns-group">
            {/* Category */}
            <div className="filter-select-wrap">
              <label>Domain:</label>
              <select
                value={selectedCategory}
                onChange={(e) => updateParam('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div className="filter-select-wrap">
              <label>Urgency:</label>
              <select
                value={selectedUrgency}
                onChange={(e) => updateParam('urgency', e.target.value)}
              >
                {URGENCIES.map((u) => (
                  <option key={u} value={u}>
                    {u.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="filter-select-wrap">
              <label>Sort:</label>
              <select
                value={selectedSort}
                onChange={(e) => updateParam('sort', e.target.value)}
              >
                <option value="hot">Popular</option>
                <option value="latest">Latest</option>
                <option value="discussed">Most Discussed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Metadata */}
        <div className="results-meta-row">
          <span>
            Found <strong>{totalCount}</strong> published challenges
          </span>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="explore-loading">
            <div className="spinner" />
            <p>Loading filtered challenges...</p>
          </div>
        ) : challenges.length > 0 ? (
          <div className={`explore-results ${isGridView ? 'grid-mode' : 'list-mode'}`}>
            {challenges.map((c) => (
              <ChallengeCard key={c._id} challenge={c} />
            ))}
          </div>
        ) : (
          <div className="explore-empty">
            <Sparkles size={40} color="#16a34a" />
            <h3>No results matched your search criteria</h3>
            <p>Try broadening your category filter or searching for another district.</p>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => fetchChallenges(page - 1)}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => fetchChallenges(page + 1)}
            >
              Next
            </button>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
