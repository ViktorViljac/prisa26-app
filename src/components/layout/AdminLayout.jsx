import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import BarChartIcon from '@mui/icons-material/BarChart';

const NAV_ITEMS = [
  { label: 'Nadzorna ploča', path: 'dashboard', icon: DashboardIcon },
  { label: 'Predaje (Foto/Tekst)', path: 'submissions', icon: PhotoLibraryIcon },
  { label: 'Korisnici', path: 'users', icon: PeopleIcon },
  { label: 'Navike', path: 'challenges', icon: EmojiEventsIcon },
  { label: 'Izazovi', path: 'achievements', icon: MilitaryTechIcon },
  { label: 'Kategorije', path: 'categories', icon: CategoryIcon },
  { label: 'Razine', path: 'levels', icon: StarIcon },
  { label: 'Timovi', path: 'teams', icon: GroupsIcon },
  { label: 'Citati', path: 'quotes', icon: FormatQuoteIcon },
  { label: 'Obavijesti', path: 'notifications', icon: NotificationsIcon },
  { label: 'Arena & Boss', path: 'arena', icon: MilitaryTechIcon },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '20px 24px' }}>
          <img src="/logo-horizontalni.png" alt="PRIŠA" style={{ maxHeight: 28, maxWidth: '60%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <sup style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: '#fff',
            transform: 'rotate(-8deg) translateY(-2px)',
            display: 'inline-block',
            filter: 'none',
            marginLeft: 2
          }}>2026</sup>
          <span className="admin-badge" style={{ marginLeft: 'auto' }}>ADMIN</span>
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
          <a
            href="https://eu.posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-nav-item"
            style={{ color: '#a78bfa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}
          >
            <BarChartIcon />
            PostHog Analitika
          </a>
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
