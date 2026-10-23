import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import LeftSidebar from '../components/LeftSidebar.jsx';
import ChallengeCard from '../components/ChallengeCard.jsx';
import BackButton from '../components/BackButton.jsx';
import './SavedChallengesPage.css';

export default function SavedChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await apiRequest('/bookmarks');
        if (res.success && res.data?.challenges) {
          setChallenges(res.data.challenges);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, []);

  return (
    <div className="saved-page-root">
      <div className="container saved-container">
        <LeftSidebar />
        <main className="saved-main-content">
          <header className="page-header saved-header">
            <BackButton fallback="/feed" label="Back to Feed" />
            <div>
              <h1 className="page-title">Saved Challenges</h1>
              <p className="page-subtitle">
                Your private collection of bookmarked community challenges in Jharkhand.
              </p>
            </div>
          </header>

          <div className="saved-challenges-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading bookmarked challenges...</p>
              </div>
            ) : challenges.length > 0 ? (
              challenges.map((c) => (
                <ChallengeCard key={c._id} challenge={c} />
              ))
            ) : (
              <div className="empty-state">
                <Bookmark size={40} color="#94a3b8" />
                <h3>No saved challenges yet</h3>
                <p>Bookmark civic challenges while exploring JanFeed to review them anytime.</p>
                <Link to="/explore" className="btn btn-primary btn-sm">
                  Explore Challenges
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
