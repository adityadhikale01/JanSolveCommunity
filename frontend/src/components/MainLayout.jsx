import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import Navbar from './Navbar.jsx';
import BottomNav from './BottomNav.jsx';
import LeftSidebar from './LeftSidebar.jsx';
import './MainLayout.css';

export default function MainLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="main-layout-root">
      <Navbar onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
      <main className="main-layout-content">
        <Outlet />
      </main>
      <BottomNav />

      {/* Mobile Sidebar Slide-in Drawer */}
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="mobile-sidebar-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div className="drawer-brand">
                <span className="drawer-icon">JS</span>
                <span className="drawer-title">JanFeed Navigation</span>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body">
              <LeftSidebar
                isMobileDrawer={true}
                onClose={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
