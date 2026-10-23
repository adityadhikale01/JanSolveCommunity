import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, TrendingUp, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../services/api.js';
import './AdminPages.css';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/analytics');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-panel">
        <div className="spinner" />
        <p>Aggregating platform civic data...</p>
      </div>
    );
  }

  const {
    categoryBreakdown = [],
    urgencyBreakdown = [],
    reviewStatusBreakdown = [],
    publicationBreakdown = [],
  } = data || {};

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-h1">Platform Civic Analytics</h1>
          <p className="admin-p">
            Quantitative analysis of civic issue reporting distributions and resolution rates in Jharkhand.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchAnalytics}>
          <RefreshCw size={14} /> Refresh Analytics
        </button>
      </div>

      <div className="admin-charts-grid">
        {/* Domain Distribution */}
        <div className="admin-panel-card">
          <h3 className="panel-card-title">Top Civic Domains Reported</h3>
          <div className="analytics-stat-list">
            {categoryBreakdown.map((item) => (
              <div key={item._id} className="analytics-row">
                <span className="analytics-label">{item._id}</span>
                <span className="analytics-badge badge badge-category">
                  {item.count} challenges
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Urgency Distribution */}
        <div className="admin-panel-card">
          <h3 className="panel-card-title">Severity Levels</h3>
          <div className="analytics-stat-list">
            {urgencyBreakdown.map((item) => (
              <div key={item._id} className="analytics-row">
                <span className="analytics-label uppercase">{item._id}</span>
                <span className={`badge badge-${item._id}`}>
                  {item.count} reports
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Workflow States */}
        <div className="admin-panel-card">
          <h3 className="panel-card-title">Administrative Review Workflow</h3>
          <div className="analytics-stat-list">
            {reviewStatusBreakdown.map((item) => (
              <div key={item._id} className="analytics-row">
                <span className="analytics-label">{item._id.replace('_', ' ')}</span>
                <span className={`badge badge-${item._id}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* JanFeed Visibility */}
        <div className="admin-panel-card">
          <h3 className="panel-card-title">JanFeed Publication States</h3>
          <div className="analytics-stat-list">
            {publicationBreakdown.map((item) => (
              <div key={item._id} className="analytics-row">
                <span className="analytics-label">{item._id.replace('_', ' ')}</span>
                <span className={`badge badge-${item._id}`}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
