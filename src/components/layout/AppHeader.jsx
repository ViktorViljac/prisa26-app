import { useAuth } from '../../contexts/AuthContext';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import DiamondIcon from '@mui/icons-material/Diamond';

export default function AppHeader({ onProfile }) {
  const { profile } = useAuth();
  const avatarLetter = profile?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className="mobile-header">
      <div className="mobile-header-top">
        <div className="mobile-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo-horizontalni.png" alt="PRIŠA" style={{ maxHeight: 26, maxWidth: 110, objectFit: 'contain' }} />
        </div>
        <div className="mobile-avatar" onClick={onProfile} style={{ cursor: 'pointer', marginLeft: 'auto' }}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile?.name} />
          ) : avatarLetter}
        </div>
      </div>
    </header>
  );
}
