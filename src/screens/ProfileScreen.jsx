import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';
import BoltIcon from '@mui/icons-material/Bolt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import GroupsIcon from '@mui/icons-material/Groups';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LogoutIcon from '@mui/icons-material/Logout';

export default function ProfileScreen({ onLogout }) {
  const { profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [installPrompt, setInstallPrompt] = useState(window.deferredPrompt);

  const level = Math.floor((profile?.xp || 0) / 500) + 1;
  const avatarLetter = profile?.name?.charAt(0)?.toUpperCase() || '?';

  useEffect(() => {
    const handlePrompt = () => {
      setInstallPrompt(window.deferredPrompt);
    };
    window.addEventListener('pwa-install-available', handlePrompt);
    return () => window.removeEventListener('pwa-install-available', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    window.deferredPrompt = null;
    setInstallPrompt(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        posthog.capture('avatar_uploaded');
        await refreshProfile();
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
    setUploading(false);
  };

  const statRows = [
    { icon: <BoltIcon />, label: 'Ukupno XP', value: profile?.xp || 0 },
    { icon: <EmojiEventsIcon />, label: 'Izazovi', value: '—' },
    { icon: <LocalFireDepartmentIcon />, label: 'Streak', value: `${profile?.streak || 0} dana` },
    { icon: <StarsIcon />, label: 'Rang', value: `Razina ${level}` },
    { icon: <GroupsIcon />, label: 'Tim', value: profile?.teams?.name || 'Nema tima' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="profile-hero">
        <div
          className="profile-avatar-large"
          onClick={() => fileRef.current?.click()}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile?.name} />
          ) : avatarLetter}
          <div className="profile-avatar-overlay">
            <CameraAltIcon />
          </div>
          {uploading && (
            <div className="profile-avatar-overlay" style={{ opacity: 1 }}>
              <span className="loading-spinner" />
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
        <div className="profile-name">{profile?.name || 'Korisnik'}</div>
        {profile?.teams && (
          <div
            className="profile-team-badge"
            style={{
              background: `${profile.teams.color}20`,
              color: profile.teams.color,
            }}
          >
            {profile.teams.icon} {profile.teams.name}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="profile-stats-card">
        {statRows.map((row, i) => (
          <div key={i} className="profile-stat-row">
            <div className="profile-stat-left">
              {row.icon}
              <span className="profile-stat-label">{row.label}</span>
            </div>
            <span className="profile-stat-value">{row.value}</span>
          </div>
        ))}
      </div>

      {/* PWA Install Button */}
      {installPrompt && (
        <button
          className="btn btn-primary btn-block btn-large"
          onClick={handleInstallClick}
          style={{ marginTop: 16, marginBottom: 8, background: 'linear-gradient(90deg, var(--prisa-teal), #2dd4bf)', border: 'none' }}
        >
          📱 Instaliraj Aplikaciju
        </button>
      )}

      {/* Feedback section */}
      <div className="profile-feedback-section">
        <div className="profile-section-title">📬 Povratne informacije</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: 12 }}>
          Imaš ideju ili prijedlog? Javi nam se!
        </p>
        <a
          href="mailto:podrska@prisa.hr"
          className="btn btn-outline"
          style={{ marginRight: 8 }}
        >
          ✉️ Email
        </a>
      </div>

      {/* Logout */}
      <button
        className="btn btn-outline btn-block btn-large"
        onClick={onLogout}
        style={{ marginTop: 8 }}
      >
        <LogoutIcon />
        Odjavi se
      </button>
    </div>
  );
}

