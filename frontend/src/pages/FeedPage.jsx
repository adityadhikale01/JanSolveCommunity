import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Flame,
  Clock,
  MessageSquare,
  PlusCircle,
  Filter,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LeftSidebar from '../components/LeftSidebar.jsx';
import RightSidebar from '../components/RightSidebar.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import './FeedPage.css';

const CATEGORIES = [
  'All',
  'Water Resources',
  'Agriculture',
  'Healthcare',
  'Sanitation',
  'Infrastructure',
  'Environment',
  'Energy',
  'Education',
  'Rural Livelihoods',
];

export default function FeedPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const currentSort = searchParams.get('sort') || 'hot';
  const currentCategory = searchParams.get('category') || 'All';
  const currentSearch = searchParams.get('search') || '';

  const fetchFeed = async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 10,
        sort: currentSort,
      });

      if (currentCategory && currentCategory !== 'All') {
        params.append('category', currentCategory);
      }
      if (currentSearch) {
        params.append('search', currentSearch);
      }

      const res = await apiRequest(`/challenges?${params.toString()}`);

      if (res.success && res.data) {
        if (append) {
          setChallenges((prev) => [...prev, ...res.data.challenges]);
        } else {
          setChallenges(res.data.challenges);
        }
        setHasMore(res.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.message || 'Unable to load JanFeed challenges');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(1, false);
  }, [currentSort, currentCategory, currentSearch]);

  const handleSortChange = (newSort) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', newSort);
    setSearchParams(next);
  };

  const handleCategoryChange = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next);
  };

  const handleVoteChange = (challengeId, newScore, newUserVote) => {
    setChallenges((prev) =>
      prev.map((c) =>
        c._id === challengeId
          ? { ...c, voteScore: newScore, userVote: newUserVote }
          : c
      )
    );
  };

  return (
    <div className="feed-page-root">
      <div className="container feed-container">
        {/* 1. Left Sidebar */}
        <LeftSidebar />

        {/* 2. Main Center Column */}
        <main className="feed-main-column">
          {/* Quick Create Prompt Bar */}
          <div className="quick-create-card">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="qc-avatar" />
            ) : (
              <div className="qc-placeholder">
                {user ? user.name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <Link to="/report" className="qc-input-mock">
              <span>Document a community problem or civic challenge in Jharkhand...</span>
            </Link>
            <Link to="/report" className="btn btn-primary btn-sm qc-btn">
              <PlusCircle size={17} />
              <span className="hide-mobile">Post</span>
            </Link>
          </div>

          {/* Feed Controls: Sorting & Categories */}
          <div className="feed-controls-card">
            <div className="sort-tabs">
              <button
                className={`sort-tab-btn ${currentSort === 'hot' ? 'active' : ''}`}
                onClick={() => handleSortChange('hot')}
              >
                <Flame size={17} />
                <span>Popular</span>
              </button>
              <button
                className={`sort-tab-btn ${currentSort === 'latest' ? 'active' : ''}`}
                onClick={() => handleSortChange('latest')}
              >
                <Clock size={17} />
                <span>Latest</span>
              </button>
              <button
                className={`sort-tab-btn ${currentSort === 'discussed' ? 'active' : ''}`}
                onClick={() => handleSortChange('discussed')}
              >
                <MessageSquare size={17} />
                <span>Most Discussed</span>
              </button>
            </div>

            {/* Category horizontal scrolling bar */}
            <div className="category-scroll-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`cat-chip-btn ${
                    (cat === 'All' && !searchParams.get('category')) ||
                    currentCategory === cat
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Active Search Filter Banner if applicable */}
          {currentSearch && (
            <div className="active-filter-banner">
              <span>
                Search results for: <strong>"{currentSearch}"</strong>
              </span>
              <button
                className="clear-search-btn"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('search');
                  setSearchParams(next);
                }}
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Challenges List */}
          <div className="challenges-feed-list">
            {loading ? (
              <div className="feed-loading-state">
                <div className="spinner" />
                <p>Fetching community challenges...</p>
              </div>
            ) : error ? (
              <div className="feed-error-state">
                <p>{error}</p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchFeed(1)}
                >
                  <RefreshCw size={15} /> Try Again
                </button>
              </div>
            ) : challenges.length > 0 ? (
              <>
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge._id}
                    challenge={challenge}
                    onVoteChange={handleVoteChange}
                  />
                ))}

                {/* Pagination / Load More */}
                {hasMore && (
                  <div className="load-more-wrap">
                    <button
                      className="btn btn-outline full-load-btn"
                      disabled={loadingMore}
                      onClick={() => fetchFeed(page + 1, true)}
                    >
                      {loadingMore ? (
                        <>
                          <div className="spinner" style={{ width: 16, height: 16 }} />
                          <span>Loading more challenges...</span>
                        </>
                      ) : (
                        <span>Load More Community Challenges</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="feed-empty-state">
                <Sparkles size={36} color="#16a34a" />
                <h3>No challenges found</h3>
                <p>
                  No challenges matched your filter criteria. Be the first to
                  document a civic challenge for this category!
                </p>
                <Link to="/report" className="btn btn-primary btn-sm">
                  Report a Community Problem
                </Link>
              </div>
            )}
          </div>
        </main>

        {/* 3. Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}
