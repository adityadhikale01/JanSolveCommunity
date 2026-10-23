import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import MainLayout from './components/MainLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';

// Citizen Pages
import LandingPage from './pages/LandingPage.jsx';
import FeedPage from './pages/FeedPage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import ChallengeDetailPage from './pages/ChallengeDetailPage.jsx';
import CreateChallengePage from './pages/CreateChallengePage.jsx';
import MyChallengesPage from './pages/MyChallengesPage.jsx';
import SavedChallengesPage from './pages/SavedChallengesPage.jsx';
import NearbyMapPage from './pages/NearbyMapPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import UserProfilePage from './pages/UserProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { AboutPage, PrivacyPage, TermsPage } from './pages/StaticPages.jsx';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminChallengesPage from './pages/admin/AdminChallengesPage.jsx';
import AdminChallengeReviewPage from './pages/admin/AdminChallengeReviewPage.jsx';
import AdminModerationPage from './pages/admin/AdminModerationPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage.jsx';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Citizen Layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
            <Route path="/report" element={<CreateChallengePage />} />
            <Route path="/challenges/new" element={<CreateChallengePage />} />
            <Route path="/my-challenges" element={<MyChallengesPage />} />
            <Route path="/saved" element={<SavedChallengesPage />} />
            <Route path="/nearby" element={<NearbyMapPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/profile/:id" element={<UserProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
          </Route>

          {/* Standalone Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="challenges" element={<AdminChallengesPage />} />
            <Route path="challenges/:id" element={<AdminChallengeReviewPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
