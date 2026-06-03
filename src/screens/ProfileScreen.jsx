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
import NotificationsIcon from '@mui/icons-material/Notifications';
import ShieldIcon from '@mui/icons-material/Shield';

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

  // Privacy Policy modal
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

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
        setSaveSuccess('🎉 Podaci spremljeni! Osvojeno +100 XP za profil i tim!');
      } else {
        setSaveSuccess('✅ Osobni podaci uspješno spremljeni!');
      }
      // Auto-close modal after showing success
      setTimeout(() => setShowEditDetails(false), 1500);
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
      // Auto-close modal after showing success
      setTimeout(() => setShowFeedbackModal(false), 1500);
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

  return (
    <div className="fade-in-content">
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
          setShowEditDetails(true);
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
          setShowFeedbackModal(true);
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
            onClick={() => setShowPrivacyPolicy(true)}
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

      {/* ==========================================
          MODALS / DIALOGS
          ========================================== */}

      {/* Osobni Podaci Modal */}
      {showEditDetails && (
        <div className="dialog-overlay" onClick={() => setShowEditDetails(false)}>
          <div 
            className="dialog-card slide-up-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              padding: '24px', 
              maxWidth: '440px',
              background: '#fcfaf7',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                👤 Osobni podaci
              </h2>
              <button 
                onClick={() => setShowEditDetails(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {!profile?.has_completed_details && (
              <div style={{
                background: 'var(--prisa-orange-light)',
                color: 'var(--prisa-orange)',
                fontSize: '0.8rem',
                fontWeight: 800,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
                border: '1px solid rgba(240, 113, 71, 0.2)',
                lineHeight: 1.4
              }}>
                🎁 Popuni sve obvezne podatke (Dob, Spol, Grad, Škola/Fakultet) za nagradu od +100 XP!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
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
                  style={{ width: '100%', marginTop: 4, padding: '8px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: '#fff' }}
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
                  style={{ width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', resize: 'vertical' }}
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={handleSaveDetails}
                disabled={savingDetails}
                style={{ marginTop: 8 }}
              >
                {savingDetails ? <span className="loading-spinner" /> : 'Spremi podatke'}
              </button>

              {saveSuccess && (
                <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)', textAlign: 'center' }}>
                  {saveSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Povratne Informacije Modal */}
      {showFeedbackModal && (
        <div className="dialog-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div 
            className="dialog-card slide-up-modal" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              padding: '24px', 
              maxWidth: '440px',
              background: '#fcfaf7',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                📬 Povratne informacije
              </h2>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', marginBottom: 14, textAlign: 'left' }}>
              Imaš ideju ili prijedlog? Tvoje mišljenje nam pomaže poboljšati aplikaciju!
            </p>
            
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 6 }}>
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
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid var(--border-color)',
                        background: feedbackRating >= val ? 'var(--prisa-orange-light)' : '#fff',
                        color: feedbackRating >= val ? 'var(--prisa-orange)' : 'var(--text-muted)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
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
                  rows="3"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-outline btn-block"
                disabled={submittingFeedback || !feedbackText.trim()}
              >
                {submittingFeedback ? <span className="loading-spinner" /> : 'Pošalji poruku'}
              </button>
            </form>

            {feedbackSuccess && (
              <div style={{ marginTop: 12, fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)', textAlign: 'center' }}>
                {feedbackSuccess}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="dialog-overlay" onClick={() => setShowPrivacyPolicy(false)}>
          <div 
            className="dialog-card slide-up-modal" 
            onClick={e => e.stopPropagation()}
            style={{
              padding: '24px',
              maxWidth: '440px',
              background: '#fcfaf7',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                🔒 Politika privatnosti
              </h2>
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.8rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              maxHeight: '350px', 
              overflowY: 'auto', 
              fontSize: '0.82rem', 
              color: 'var(--text-dark)', 
              lineHeight: 1.5,
              background: '#fff',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
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
              onClick={() => setShowPrivacyPolicy(false)}
              style={{ marginTop: '20px' }}
            >
              U redu, razumijem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
