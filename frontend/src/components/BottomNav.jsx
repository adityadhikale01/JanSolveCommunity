import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusCircle, MapPin, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './BottomNav.css';

export default function BottomNav() {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="bottom-nav">
      <NavLink
        to="/feed"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <Home size={20} />
        <span>Feed</span>
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <Compass size={20} />
        <span>Explore</span>
      </NavLink>

      <NavLink
        to="/report"
        className={({ isActive }) =>
          `bottom-nav-item bottom-create ${isActive ? 'active' : ''}`
        }
      >
        <div className="bottom-create-icon">
          <PlusCircle size={24} />
        </div>
        <span>Report</span>
      </NavLink>

      <NavLink
        to="/nearby"
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <MapPin size={20} />
        <span>Nearby</span>
      </NavLink>

      <NavLink
        to={isAuthenticated ? '/messages' : '/login'}
        className={({ isActive }) =>
          `bottom-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <MessageSquare size={20} />
        <span>Messages</span>
      </NavLink>
    </nav>
  );
}
