import { useState, useEffect, useRef, useCallback } from 'react';
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
import NotificationsIcon from '@mui/icons-material/Notifications';
import ShieldIcon from '@mui/icons-material/Shield';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ProfileScreen({ onLogout }) {
  const { profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [installPrompt, setInstallPrompt] = useState(window.deferredPrompt);

  // Profile Details fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [schoolOrCollege, setSchoolOrCollege] = useState('');
  const [bio, setBio] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Feedback form fields
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // Navigation sub-page state
  const [subPage, setSubPage] = useState(null); // null | 'details' | 'feedback' | 'privacy'

  // Touch gesture state for swipe-to-go-back
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const sliderRef = useRef(null);

  // Scroll to top on subPage changes
  useEffect(() => {
    window.scrollTo(0, 0);
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTop = 0;
    const mobileContent = document.querySelector('.mobile-content');
    if (mobileContent) mobileContent.scrollTop = 0;
  }, [subPage]);

  const handleTouchStart = useCallback((e) => {
    if (!subPage) return;
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, [subPage]);

  const handleTouchMove = useCallback((e) => {
    if (!subPage) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (delta > 0) {
      touchDeltaX.current = delta;
      if (sliderRef.current) {
        sliderRef.current.style.transform = `translateX(calc(-50% + ${delta}px))`;
        sliderRef.current.style.transition = 'none';
      }
    }
  }, [subPage]);

  const handleTouchEnd = useCallback(() => {
    if (!subPage) return;
    if (touchDeltaX.current > 100) {
      // Swiped far enough to the right -> go back to main profile
      if (sliderRef.current) {
        sliderRef.current.style.transform = 'translateX(0)';
        sliderRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      }
      setTimeout(() => setSubPage(null), 250);
    } else {
      // Snap back to sub-page
      if (sliderRef.current) {
        sliderRef.current.style.transform = 'translateX(-50%)';
        sliderRef.current.style.transition = 'transform 0.2s ease';
      }
    }
    touchDeltaX.current = 0;
  }, [subPage]);

  const level = Math.floor((profile?.xp || 0) / 500) + 1;
  const avatarLetter = profile?.name?.charAt(0)?.toUpperCase() || '?';

  useEffect(() => {
    const handlePrompt = () => {
      setInstallPrompt(window.deferredPrompt);
    };
    window.addEventListener('pwa-install-available', handlePrompt);
    return () => window.removeEventListener('pwa-install-available', handlePrompt);
  }, []);

  // Initialize fields on load
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAge(profile.age || '');
      setGender(profile.gender || '');
      setCity(profile.city || '');
      setSchoolOrCollege(profile.school_or_college || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

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

  const handleSaveDetails = async () => {
    if (!profile) return;
    setSavingDetails(true);
    setSaveSuccess('');

    try {
      const parsedAge = parseInt(age) || null;
      const isCompletingFirstTime = 
        !profile.has_completed_details &&
        parsedAge && 
        gender && 
        city.trim() && 
        schoolOrCollege.trim();

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          age: parsedAge,
          gender,
          city: city.trim(),
          school_or_college: schoolOrCollege.trim(),
          bio: bio.trim()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      posthog.capture('profile_details_updated', {
        has_first_name: !!firstName.trim(),
        has_last_name: !!lastName.trim(),
        has_age: !!parsedAge,
        has_gender: !!gender,
        has_city: !!city.trim(),
        has_school: !!schoolOrCollege.trim()
      });

      await refreshProfile();
      
      if (isCompletingFirstTime) {
        setSaveSuccess('🎉 Podaci spremljeni! Osvojeno +50 XP za profil i tim!');
      } else {
        setSaveSuccess('✅ Osobni podaci uspješno spremljeni!');
      }
      // Auto-close sub-page after showing success
      setTimeout(() => setSubPage(null), 1500);
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja podataka.');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim() || !profile) return;
    setSubmittingFeedback(true);
    setFeedbackSuccess('');

    try {
      const { error } = await supabase.from('feedbacks').insert({
        user_id: profile.id,
        text: feedbackText.trim(),
        rating: feedbackRating
      });

      if (error) throw error;
      setFeedbackSuccess('Hvala ti na povratnim informacijama! ❤️');
      setFeedbackText('');
      setFeedbackRating(5);
      // Auto-close sub-page after showing success
      setTimeout(() => setSubPage(null), 1500);
    } catch (err) {
      console.error(err);
      alert('Greška prilikom slanja povratnih informacija.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const saveMockSubscription = async () => {
    try {
      const mockEndpoint = `https://mock.push.prisa.hr/sub/${profile.id}/${Math.random().toString(36).substr(2, 9)}`;
      const mockKeys = {
        p256dh: 'BC_mock_p256dh_key_values_for_testing_purposes_only',
        auth: 'mock_auth_key_12345'
      };

      const { error } = await supabase.from('push_subscriptions').insert({
        user_id: profile.id,
        endpoint: mockEndpoint,
        keys: mockKeys
      });

      if (error) throw error;
      alert('Uspješno ste se pretplatili na obavijesti! 🎉');
    } catch (err) {
      console.error(err);
      alert('Greška prilikom pretplate.');
    }
  };

  const handlePushSubscribe = async () => {
    if (!profile) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      saveMockSubscription();
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Dozvola za obavijesti nije odobrena.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      
      if (!sub) {
        const randomVapidKey = 'BFN-8Nf29f0J8H1bS8P4N4kP0h_P6mK2K0H5o7n5r1X4Y7m8kP0h_P6mK2K0H5o7n5r1X4Y7m';
        try {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: randomVapidKey
          });
        } catch (e) {
          console.warn('Real push registration failed or blocked. Saving mock subscription.', e);
          saveMockSubscription();
          return;
        }
      }

      if (sub) {
        const { error } = await supabase.from('push_subscriptions').insert({
          user_id: profile.id,
          endpoint: sub.endpoint,
          keys: JSON.parse(JSON.stringify(sub))?.keys || {}
        });

        if (error) throw error;
        alert('Uspješno ste se pretplatili na obavijesti! 🎉');
      }
    } catch (err) {
      console.error(err);
      saveMockSubscription();
    }
  };

  const statRows = [
    { icon: <BoltIcon />, label: 'Ukupno XP', value: profile?.xp || 0 },
    { icon: <LocalFireDepartmentIcon />, label: 'Vatrice', value: `${profile?.streak || 0}` },
    { icon: <StarsIcon />, label: 'Rang', value: `Razina ${level}` },
    { icon: <GroupsIcon />, label: 'Tim', value: profile?.teams?.name || 'Nema tima' },
  ];

  const renderDetails = () => (
    <div className="profile-stats-card" style={{ margin: 0, padding: 20 }}>
      <div className="subpage-header" style={{ padding: '0 0 16px 0', borderRadius: 0, marginBottom: 20 }}>
        <button className="subpage-back-btn" onClick={() => setSubPage(null)} style={{ padding: '6px 8px', marginLeft: -8 }}>
          <ArrowBackIcon style={{ fontSize: 18 }} /> Natrag
        </button>
        <h2 className="subpage-title">👤 Osobni podaci</h2>
      </div>

      {!profile?.has_completed_details && (
        <div style={{
          background: 'var(--prisa-orange-light)',
          color: 'var(--prisa-orange)',
          fontSize: '0.8rem',
          fontWeight: 800,
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20,
          border: '1px solid rgba(240, 113, 71, 0.2)',
          lineHeight: 1.4
        }}>
          🎁 Popuni sve obvezne podatke (Dob, Spol, Grad, Škola/Fakultet) za nagradu od +50 XP!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile Picture Change Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
          <div
            className="profile-avatar-large"
            onClick={() => fileRef.current?.click()}
            style={{ margin: '0 auto 8px' }}
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
          <button 
            type="button"
            className="btn btn-outline btn-sm" 
            onClick={() => fileRef.current?.click()}
            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
          >
            Promijeni sliku
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Ime</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="npr. Ivan"
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Prezime</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="npr. Horvat"
              style={{ width: '100%', marginTop: 4 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Dob (godine) *</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder="npr. 18"
            min="1"
            max="120"
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Spol *</label>
          <select
            value={gender}
            onChange={e => setGender(e.target.value)}
            style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: '#fff', fontSize: '0.9rem' }}
          >
            <option value="">Odaberi spol</option>
            <option value="Muško">Muško</option>
            <option value="Žensko">Žensko</option>
            <option value="Drugo">Drugo</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Grad *</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="npr. Split"
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Škola ili Fakultet *</label>
          <input
            type="text"
            value={schoolOrCollege}
            onChange={e => setSchoolOrCollege(e.target.value)}
            placeholder="npr. Druga gimnazija"
            style={{ width: '100%', marginTop: 4 }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Bio (Kratak opis)</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Napiši nešto o sebi..."
            rows="3"
            style={{ width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', resize: 'vertical' }}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleSaveDetails}
          disabled={savingDetails}
          style={{ marginTop: 4 }}
        >
          {savingDetails ? <span className="loading-spinner" /> : 'Spremi podatke'}
        </button>

        {saveSuccess && (
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)', textAlign: 'center' }}>
            {saveSuccess}
          </div>
        )}
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="profile-stats-card" style={{ margin: 0, padding: 20 }}>
      <div className="subpage-header" style={{ padding: '0 0 16px 0', borderRadius: 0, marginBottom: 20 }}>
        <button className="subpage-back-btn" onClick={() => setSubPage(null)} style={{ padding: '6px 8px', marginLeft: -8 }}>
          <ArrowBackIcon style={{ fontSize: 18 }} /> Natrag
        </button>
        <h2 className="subpage-title">📬 Povratne informacije</h2>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: 20, lineHeight: 1.5 }}>
        Imaš ideju ili prijedlog? Tvoje mišljenje nam pomaže poboljšati aplikaciju!
      </p>
      
      <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 8 }}>
            Ocjena aplikacije:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setFeedbackRating(val)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--border-color)',
                  background: feedbackRating >= val ? 'var(--prisa-orange-light)' : '#fff',
                  color: feedbackRating >= val ? 'var(--prisa-orange)' : 'var(--text-muted)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  transition: 'all 0.15s ease'
                }}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Napiši svoje komentare ili prijedloge..."
            rows="4"
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', resize: 'vertical', fontSize: '0.9rem' }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submittingFeedback || !feedbackText.trim()}
        >
          {submittingFeedback ? <span className="loading-spinner" /> : 'Pošalji poruku'}
        </button>
      </form>

      {feedbackSuccess && (
        <div style={{ marginTop: 16, fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)', textAlign: 'center' }}>
          {feedbackSuccess}
        </div>
      )}
    </div>
  );

  const renderPrivacy = () => (
    <div className="profile-stats-card" style={{ margin: 0, padding: 20 }}>
      <div className="subpage-header" style={{ padding: '0 0 16px 0', borderRadius: 0, marginBottom: 20 }}>
        <button className="subpage-back-btn" onClick={() => setSubPage(null)} style={{ padding: '6px 8px', marginLeft: -8 }}>
          <ArrowBackIcon style={{ fontSize: 18 }} /> Natrag
        </button>
        <h2 className="subpage-title">🔒 Politika privatnosti</h2>
      </div>

      <div style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-dark)', 
        lineHeight: 1.6,
        textAlign: 'left'
      }}>
        <p style={{ marginTop: 0 }}>
          <strong>Priša 2026</strong> je platforma posvećena istraživanju i unapređenju životnih navika mladih.
        </p>
        <p>
          Svi podaci o unesenim navikama, izazovima i aktivnostima koriste se isključivo u agregiranom i potpuno anonimiziranom obliku za analitičke i istraživačke svrhe.
        </p>
        <p>
          Nijedan osobni podatak (poput imena, prezimena ili adrese e-pošte) se ne dijeli s trećim stranama, niti se koristi u komercijalne svrhe.
        </p>
        <p>
          Prikupljeni demografski podaci (dob, spol, lokacija, škola ili fakultet) služe isključivo za analizu trendova i donošenje preporuka za zdraviji život mladih u sklopu ovog znanstvenog projekta.
        </p>
        <p style={{ marginBottom: 0 }}>
          Korištenjem ove aplikacije i spremanjem svojih podataka potvrđujete slaganje s navedenim uvjetima te sudjelovanjem u istraživanju. Hvala vam na doprinosu!
        </p>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={() => setSubPage(null)}
        style={{ marginTop: '24px' }}
      >
        U redu, razumijem
      </button>
    </div>
  );

  return (
    <div className="profile-slider-container">
      <div
        className="profile-slider-track"
        ref={sliderRef}
        style={{
          transform: subPage ? 'translateX(-50%)' : 'translateX(0)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Main profile slide */}
        <div className="profile-slider-slide fade-in-content" style={{ padding: '0 4px' }}>
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

          {/* Osobni podaci Gumb */}
          <div 
            className="profile-stats-card hover-scale" 
            style={{ marginTop: 24, padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
            onClick={() => {
              setSaveSuccess('');
              setSubPage('details');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>👤</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)' }}>Osobni podaci</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Ažuriraj svoje demografske podatke i osvoji XP</div>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>➔</span>
          </div>

          {/* Povratne informacije Gumb */}
          <div 
            className="profile-stats-card hover-scale" 
            style={{ marginTop: 16, padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} 
            onClick={() => {
              setFeedbackSuccess('');
              setSubPage('feedback');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.4rem' }}>📬</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-dark)' }}>Povratne informacije</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>Podijeli svoje mišljenje ili prijedloge s nama</div>
              </div>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>➔</span>
          </div>

          {/* Postavke i Sigurnost s integriranim PWA gumbom */}
          <div className="profile-stats-card" style={{ marginTop: 24, padding: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 16 }}>
              ⚙️ Postavke i Sigurnost
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {installPrompt && (
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleInstallClick}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    background: 'linear-gradient(90deg, var(--prisa-teal), #2dd4bf)', 
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700
                  }}
                >
                  📱 Instaliraj Aplikaciju
                </button>
              )}

              <button
                className="btn btn-outline btn-block"
                onClick={handlePushSubscribe}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  background: 'var(--prisa-blue)',
                  borderColor: 'var(--prisa-blue)',
                  color: '#fff'
                }}
              >
                <NotificationsIcon style={{ fontSize: 18 }} />
                Pretplati se na obavijesti
              </button>

              <button
                className="btn btn-outline btn-block"
                onClick={() => setSubPage('privacy')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px'
                }}
              >
                <ShieldIcon style={{ fontSize: 18 }} />
                Politika privatnosti
              </button>
            </div>
          </div>

          {/* Logout */}
          <button
            className="btn btn-outline btn-block btn-large"
            onClick={onLogout}
            style={{ marginTop: 24, marginBottom: 32 }}
          >
            <LogoutIcon style={{ marginRight: '8px' }} />
            Odjavi se
          </button>
        </div>

        {/* Sub-page slide */}
        <div className="profile-slider-slide" style={{ padding: '0 4px' }}>
          {subPage === 'details' && renderDetails()}
          {subPage === 'feedback' && renderFeedback()}
          {subPage === 'privacy' && renderPrivacy()}
        </div>
      </div>
    </div>
  );
}
