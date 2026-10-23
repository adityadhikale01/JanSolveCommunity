import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './BackButton.css';

export default function BackButton({
  fallback = '/feed',
  label = 'Back',
  className = '',
  showLabel = true,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    // If browser history has a previous entry in this session, navigate back
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`symbolic-back-btn ${className}`}
      aria-label={label || 'Go back to previous page'}
      title={label ? `${label}` : 'Go back'}
    >
      <span className="back-icon-circle">
        <ArrowLeft size={15} className="back-arrow-icon" />
      </span>
      {showLabel && <span className="back-btn-text">{label}</span>}
    </button>
  );
}
