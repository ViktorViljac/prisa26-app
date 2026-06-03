import { useAuth } from '../../contexts/AuthContext';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import DiamondIcon from '@mui/icons-material/Diamond';

export default function AppHeader({ onProfile }) {
  const { profile } = useAuth();

  const level = profile ? Math.floor(profile.xp / 500) + 1 : 1;
  const avatarLetter = profile?.name?.charAt(0)?.toUpperCase() || '?';

  const resources = [
    { icon: <BoltIcon />, value: profile?.xp || 0, bg: '#fff0eb', color: '#f07147' },
    { icon: <LocalFireDepartmentIcon />, value: profile?.streak || 0, bg: '#ffedd5', color: '#f07147' },
    { icon: <StarsIcon />, value: level, bg: '#dbeafe', color: '#3b82f6' },
    { icon: <DiamondIcon />, value: profile?.gems || 0, bg: '#ccfbf1', color: '#0d9488' },
  ];

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <div className="mobile-user-info">
          <div className="mobile-avatar" onClick={onProfile} style={{ cursor: 'pointer' }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile?.name} />
            ) : avatarLetter}
          </div>
          <div>
            <div className="mobile-user-name">{profile?.name || 'Korisnik'}</div>
            <div className="mobile-user-rank">
              {profile?.teams?.name || 'Bez tima'} • Razina {level}
            </div>
          </div>
        </div>
        <div className="mobile-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo-horizontalni.png" alt="PRIŠA" style={{ maxHeight: 24, maxWidth: 100, objectFit: 'contain' }} />
        </div>
      </div>

      <div className="mobile-resource-row">
        {resources.map((r, i) => (
          <div key={i} className="resource-pill">
            <div
              className="resource-pill-icon"
              style={{ background: r.bg, color: r.color }}
            >
              {r.icon}
            </div>
            {r.value}
          </div>
        ))}
      </div>
    </header>
  );
}
