import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, RefreshCw, Eye, ExternalLink } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import './AdminPages.css';

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

const REVIEW_STATUSES = [
  'All',
  'submitted',
  'under_review',
  'information_requested',
  'verified',
  'rejected',
];

const PUBLICATION_STATUSES = ['All', 'pending_review', 'published', 'removed'];

export default function AdminChallengesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const selectedCategory = searchParams.get('category') || 'All';
  const selectedReview = searchParams.get('reviewStatus') || 'All';
  const selectedPub = searchParams.get('publicationStatus') || 'All';
  const search = searchParams.get('search') || '';

  const [term, setTerm] = useState(search);

  const fetchChallenges = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: p,
        limit: 15,
      });

      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedReview !== 'All') params.append('reviewStatus', selectedReview);
      if (selectedPub !== 'All') params.append('publicationStatus', selectedPub);
      if (search) params.append('search', search);

      const res = await apiRequest(`/admin/challenges?${params.toString()}`);
      if (res.success && res.data) {
        setChallenges(res.data.challenges);
        setTotalCount(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages || 1);
        setPage(p);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges(1);
  }, [selectedCategory, selectedReview, selectedPub, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (term.trim()) next.set('search', term.trim());
    else next.delete('search');
    setSearchParams(next);
  };

  const updateFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'All') next.delete(key);
    else next.set(key, val);
    setSearchParams(next);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-h1">Civic Challenges Management</h1>
          <p className="admin-p">
            Inspect citizen submissions, moderate content, verify on-ground reports, and approve for JanFeed.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-filter-bar">
        <form className="admin-search-form" onSubmit={handleSearchSubmit}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search title, description, or location..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div className="admin-filter-selects">
          <select
            value={selectedCategory}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Domains' : c}
              </option>
            ))}
          </select>

          <select
            value={selectedReview}
            onChange={(e) => updateFilter('reviewStatus', e.target.value)}
          >
            {REVIEW_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Review States' : s.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={selectedPub}
            onChange={(e) => updateFilter('publicationStatus', e.target.value)}
          >
            {PUBLICATION_STATUSES.map((p) => (
              <option key={p} value={p}>
                {p === 'All' ? 'All JanFeed States' : p.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-panel-card">
        <div className="panel-header-row">
          <span className="results-count-text">
            Found <strong>{totalCount}</strong> challenges
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => fetchChallenges(page)}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="admin-loading-panel">
            <div className="spinner" />
          </div>
        ) : challenges.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Author</th>
                  <th>Submitted</th>
                  <th>Urgency</th>
                  <th>Review Status</th>
                  <th>JanFeed Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((c) => (
                  <tr key={c._id}>
                    <td className="cell-title font-medium">
                      <Link to={`/admin/challenges/${c._id}`}>{c.title}</Link>
                    </td>
                    <td>
                      <span className="badge badge-category">{c.category}</span>
                    </td>
                    <td className="cell-loc">{c.locationText}</td>
                    <td>{c.author?.name || 'Citizen'}</td>
                    <td className="cell-date">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <span className={`badge badge-${c.urgency}`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.reviewStatus}`}>
                        {c.reviewStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${c.publicationStatus}`}>
                        {c.publicationStatus}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/admin/challenges/${c._id}`}
                        className="btn btn-primary btn-sm btn-table-action"
                      >
                        <Eye size={14} /> Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-table">
            <p>No challenges found matching these criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-bar admin-pagination">
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
      </div>
    </div>
  );
}
