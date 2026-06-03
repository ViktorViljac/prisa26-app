import { useAuth } from '../../contexts/AuthContext';
import HomeIcon from '@mui/icons-material/Home';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const NAV_ITEMS = [
  { label: 'Početna', icon: HomeIcon },
  { label: 'Navike', icon: EmojiEventsIcon },
  { label: 'Arena', icon: SportsKabaddiIcon },
  { label: 'Rang', icon: LeaderboardIcon },
  { label: 'Izazovi', icon: MilitaryTechIcon },
  { label: 'Profil', icon: PersonIcon },
];

export default function SidebarNav({ navValue, setNavValue, onLogout, onAdmin }) {
  const { profile, isAdmin } = useAuth();

  const xpIntoLevel = profile ? (profile.xp % 500) : 0;
  const xpForNext = 500;
  const level = profile ? Math.floor(profile.xp / 500) + 1 : 1;
  const avatarLetter = profile?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand" style={{ justifyContent: 'center', padding: '16px 24px' }}>
        <img src="/logo-horizontalni.png" alt="PRIŠA" style={{ maxHeight: 38, maxWidth: '100%', objectFit: 'contain' }} />
      </div>

      {/* User card */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} />
            ) : avatarLetter}
          </div>
          <div>
            <div className="sidebar-user-name">{profile?.name || 'Korisnik'}</div>
            <div className="sidebar-user-level">Razina {level} • {profile?.xp || 0} XP</div>
          </div>
        </div>
        <div className="sidebar-xp-bar">
          <div
            className="sidebar-xp-fill"
            style={{ width: `${(xpIntoLevel / xpForNext) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, idx) => (
          <button
            key={idx}
            className={`sidebar-nav-item ${navValue === idx ? 'active' : ''}`}
            onClick={() => setNavValue(idx)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}

        {isAdmin && (
          <button className="sidebar-nav-item" onClick={onAdmin} style={{ marginTop: 8 }}>
            <AdminPanelSettingsIcon />
            Admin
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-nav-item" onClick={onLogout}>
          <LogoutIcon />
          Odjava
        </button>
      </div>
    </aside>
  );
}
