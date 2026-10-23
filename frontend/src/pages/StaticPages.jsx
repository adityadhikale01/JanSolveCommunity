import React from 'react';
import { ShieldCheck, Heart, Sparkles, Scale, Lock } from 'lucide-react';
import BackButton from '../components/BackButton.jsx';
import './StaticPages.css';

export function AboutPage() {
  return (
    <div className="static-page-root">
      <div className="container static-container">
        <BackButton fallback="/" label="Back to Home" />
        <h1 className="static-title">About JanSolve & JanFeed</h1>
        <p className="static-lead">
          A dedicated civic participation platform engineered for communities across Jharkhand, India.
        </p>

        <section className="static-section">
          <h2>Our Civic Mission</h2>
          <p>
            Jharkhand spans 24 diverse districts rich in mineral resources, agricultural heritage, and vibrant tribal culture. Yet many communities continue to face systemic challenges in accessing clean drinking water, rural healthcare diagnostics, seasonal pestilence management, and basic public infrastructure.
          </p>
          <p>
            JanSolve bridges the gap between grassroots citizen observation and structured administrative review. JanFeed provides a community layer inspired by discussion-driven platforms where citizens discuss, upvote, and document local needs transparently.
          </p>
        </section>

        <section className="static-section">
          <h2>Core Principles</h2>
          <div className="static-grid">
            <div className="static-box">
              <ShieldCheck size={24} color="#16a34a" />
              <h4>Evidence-Based</h4>
              <p>Every problem statement is grounded in real photographic, video, or location coordinates.</p>
            </div>
            <div className="static-box">
              <Scale size={24} color="#16a34a" />
              <h4>Verified Transparency</h4>
              <p>Submissions undergo rigorous moderation and verification before being published on the community feed.</p>
            </div>
            <div className="static-box">
              <Heart size={24} color="#16a34a" />
              <h4>Constructive Discussion</h4>
              <p>JanFeed prioritizes constructive dialogue, local solutions, and community collaboration.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="static-page-root">
      <div className="container static-container">
        <BackButton fallback="/" label="Back to Home" />
        <h1 className="static-title">Privacy Policy</h1>
        <p className="static-lead">
          How JanSolve protects your civic privacy, account credentials, and personal information.
        </p>

        <section className="static-section">
          <h2>Information We Collect</h2>
          <p>
            To facilitate community submissions, JanSolve collects your full name, email address, password hash, and optional profile bio and district. When you report a civic issue, we collect the problem details, geographic coordinates, and media evidence you voluntarily provide.
          </p>
        </section>

        <section className="static-section">
          <h2>Private Messaging & Security</h2>
          <p>
            One-to-one private messages exchanged between citizens are strictly accessible only by the conversation participants. Email addresses and password credentials are never exposed in public profile APIs. Passwords are cryptographically hashed using industry-standard bcrypt algorithms.
          </p>
        </section>

        <section className="static-section">
          <h2>Geographic Data & Cookies</h2>
          <p>
            We only access your browser geolocation when you explicitly click "Use Current Location" or "Near Me". Session authentication utilizes secure HTTP cookies or bearer access tokens.
          </p>
        </section>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="static-page-root">
      <div className="container static-container">
        <BackButton fallback="/" label="Back to Home" />
        <h1 className="static-title">Terms of Service</h1>
        <p className="static-lead">
          Community standards and user agreement for JanSolve and JanFeed.
        </p>

        <section className="static-section">
          <h2>Civic Integrity Guidelines</h2>
          <p>
            By using JanSolve, you agree to submit truthful, on-ground civic challenges. Fabricating emergency reports, submitting deceptive media, or harassing fellow citizens will result in immediate suspension by administrative moderators.
          </p>
        </section>

        <section className="static-section">
          <h2>Content Moderation</h2>
          <p>
            Administrators retain the authority to review, approve, reject, or request additional information on any submitted challenge. Any content reported by the community for hate speech, defamation, or false claims is investigated through our administrative moderation queue.
          </p>
        </section>
      </div>
    </div>
  );
}
