import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import GroupsIcon from '@mui/icons-material/Groups';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const NAV_ITEMS = [
  { label: 'Nadzorna ploča', path: 'dashboard', icon: DashboardIcon },
  { label: 'Korisnici', path: 'users', icon: PeopleIcon },
  { label: 'Navike', path: 'challenges', icon: EmojiEventsIcon },
  { label: 'Izazovi', path: 'achievements', icon: MilitaryTechIcon },
  { label: 'Timovi', path: 'teams', icon: GroupsIcon },
  { label: 'Citati', path: 'quotes', icon: FormatQuoteIcon },
  { label: 'Obavijesti', path: 'notifications', icon: NotificationsIcon },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 24px' }}>
          <img src="/logo-horizontalni.png" alt="PRIŠA" style={{ maxHeight: 28, maxWidth: '70%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <span className="admin-badge">ADMIN</span>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="admin-nav-item"
            onClick={() => navigate('/')}
            style={{ color: '#ff7a59' }}
          >
            <ArrowBackIcon />
            Aplikacija
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
