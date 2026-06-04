import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';
import TimerIcon from '@mui/icons-material/Timer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Drawer from '../components/Drawer';
import EditIcon from '@mui/icons-material/Edit';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SavingsIcon from '@mui/icons-material/Savings';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HelpOutlineIcon from '@mui/icons-material/Help';
import WorkIcon from '@mui/icons-material/Work';
import CodeIcon from '@mui/icons-material/Code';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import BrushIcon from '@mui/icons-material/Brush';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

const CATEGORY_ICONS = {
  // Name mapping
  'Zdravlje': FavoriteIcon,
  'Fitness': FitnessCenterIcon,
  'Financije': SavingsIcon,
  'Učenje': SchoolIcon,
  'Društvo': GroupsIcon,
  'Mindfulness': SelfImprovementIcon,
  'Čitanje': AutoStoriesIcon,
  'Prehrana': RestaurantIcon,

  // Icon name mapping
  'FavoriteIcon': FavoriteIcon,
  'FitnessCenterIcon': FitnessCenterIcon,
  'SavingsIcon': SavingsIcon,
  'SchoolIcon': SchoolIcon,
  'GroupsIcon': GroupsIcon,
  'SelfImprovementIcon': SelfImprovementIcon,
  'AutoStoriesIcon': AutoStoriesIcon,
  'RestaurantIcon': RestaurantIcon,
  'WorkIcon': WorkIcon,
  'CodeIcon': CodeIcon,
  'SportsEsportsIcon': SportsEsportsIcon,
  'BrushIcon': BrushIcon,
  'TravelExploreIcon': TravelExploreIcon,
};

const VERIFY_LABELS = {
  self_report: { label: 'Potvrdi', icon: TouchAppIcon, cls: 'self-report' },
  field_input: { label: 'Unos', icon: EditIcon, cls: 'field-input' },
  photo_upload: { label: 'Foto', icon: PhotoCameraIcon, cls: 'photo-upload' },
};

function pad(n) { return String(n).padStart(2, '0'); }

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `Kreće: ${day}.${month}.`;
}

export default function IzazoviScreen() {
  const { profile, refreshProfile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [dayProgress, setDayProgress] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [fieldValue, setFieldValue] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      const [catRes, chalRes, ucRes] = await Promise.all([
        supabase.from('challenge_categories').select('*').order('sort_order'),
        supabase.from('challenges').select('*, challenge_categories(name, icon, gradient_start, gradient_end)').in('visibility', ['visible', 'coming_soon', 'mystery']),
        profile ? supabase.from('user_challenges').select('*').eq('user_id', profile.id) : { data: [] },
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (chalRes.data) setChallenges(chalRes.data);
      if (ucRes.data) setUserChallenges(ucRes.data);
    };
    fetchData();
  }, [profile]);

  // Countdown
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utc2 = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
      const tomorrow = new Date(utc2);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - utc2;
      setCountdown(`${pad(Math.floor(diff / 3600000))}:${pad(Math.floor((diff % 3600000) / 60000))}:${pad(Math.floor((diff % 60000) / 1000))}`);

      // Day progress
      const start = new Date(utc2);
      start.setHours(0, 0, 0, 0);
      setDayProgress(((utc2 - start) / 86400000) * 100);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = activeCategory
    ? challenges.filter(c => c.category_id === activeCategory)
    : challenges;

  const completed = userChallenges.filter(uc => uc.is_completed).length;

  const getProgress = (challengeId) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return null;

    if (challenge.is_daily) {
      const today = new Date().toISOString().split('T')[0];
      return userChallenges.find(u => u.challenge_id === challengeId && u.date === today) || null;
    } else {
      const ucs = userChallenges.filter(u => u.challenge_id === challengeId);
      if (ucs.length === 0) return null;
      return ucs.reduce((max, current) => (current.progress > max.progress ? current : max), ucs[0]);
    }
  };

  const handleSelfReport = async (challenge) => {
    if (!profile) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = getProgress(challenge.id);
      const newProgress = Math.min((existing?.progress || 0) + 1, challenge.target_count);
      const isDone = newProgress >= challenge.target_count;

      const { error } = await supabase.from('user_challenges').upsert({
        user_id: profile.id,
        challenge_id: challenge.id,
        progress: newProgress,
        is_completed: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        date: today,
      }, { onConflict: 'user_id,challenge_id,date' });

      if (!error) {
        const increment = newProgress - (existing?.progress || 0);
        if (increment > 0) {
          // Award XP for each step
          await supabase.rpc('award_xp', {
            p_user_id: profile.id,
            p_xp_amount: challenge.xp_reward * increment,
          });
        }

        if (isDone) {
          posthog.capture('challenge_completed', {
            challenge_id: challenge.id,
            challenge_title: challenge.title,
            xp_reward: challenge.xp_reward,
            verification_type: 'self_report',
          });
        } else {
          posthog.capture('challenge_progress', {
            challenge_id: challenge.id,
            progress: newProgress,
            target: challenge.target_count,
          });
        }
        await refreshProfile();
        
        // Refresh user challenges
        const { data } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
        if (data) setUserChallenges(data);
      }
    } catch (err) {
      console.error('Challenge completion error:', err);
    }
    setSubmitting(false);
    setSelectedChallenge(null);
  };

  const handleFieldSubmit = async (challenge) => {
    if (!profile || !fieldValue) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const numVal = parseInt(fieldValue) || 0;
      const existing = getProgress(challenge.id);
      const newProgress = Math.min((existing?.progress || 0) + numVal, challenge.target_count);
      const isDone = newProgress >= challenge.target_count;

      await supabase.from('user_challenges').upsert({
        user_id: profile.id,
        challenge_id: challenge.id,
        progress: newProgress,
        is_completed: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        date: today,
      }, { onConflict: 'user_id,challenge_id,date' });

      const increment = newProgress - (existing?.progress || 0);
      if (increment > 0) {
        await supabase.rpc('award_xp', {
          p_user_id: profile.id,
          p_xp_amount: challenge.xp_reward * increment,
        });
      }

      if (isDone) {
        posthog.capture('challenge_completed', {
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          xp_reward: challenge.xp_reward,
          verification_type: 'field_input',
          field_value: numVal,
        });
      } else {
        posthog.capture('challenge_progress', {
          challenge_id: challenge.id,
          progress: newProgress,
          target: challenge.target_count,
        });
      }

      await refreshProfile();
      const { data } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
      if (data) setUserChallenges(data);
      setFieldValue('');
    } catch (err) {
      console.error('Field submit error:', err);
    }
    setSubmitting(false);
    setSelectedChallenge(null);
  };

  const handlePhotoSubmit = async (challenge) => {
    if (!profile || !photoFile) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const filePath = `${profile.id}/challenge-proofs/${challenge.id}_${today}_${Date.now()}.${photoFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, photoFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

        await supabase.from('user_challenges').upsert({
          user_id: profile.id,
          challenge_id: challenge.id,
          progress: challenge.target_count,
          is_completed: false, // Pending admin approval
          proof_url: publicUrl,
          date: today,
        }, { onConflict: 'user_id,challenge_id,date' });

        posthog.capture('challenge_photo_submitted', {
          challenge_id: challenge.id,
          challenge_title: challenge.title,
        });

        const { data } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
        if (data) setUserChallenges(data);
      }
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error('Photo submit error:', err);
    }
    setSubmitting(false);
    setSelectedChallenge(null);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const getCategoryIcon = (challengeCat) => {
    if (!challengeCat) return <FavoriteIcon />;
    const iconName = challengeCat.icon;
    const Icon = CATEGORY_ICONS[iconName] || CATEGORY_ICONS[challengeCat.name] || FavoriteIcon;
    return <Icon />;
  };

  return (
    <div>
      {/* Header */}
      <div className="challenges-header">
        <div className="challenges-count">
          <span>{completed}</span> / {challenges.filter(c => c.visibility === 'visible').length} odrađenih navika
        </div>
      </div>

      {/* Categories */}
      <div className="categories-row">
        <button
          className={`category-pill ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          Sve
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
          >
            {getCategoryIcon(cat)}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Day Timer */}
      <div className="day-timer">
        <div className="day-timer-label">
          <TimerIcon style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }} />
          Novi dan za
        </div>
        <div className="day-timer-clock">{countdown}</div>
      </div>
      <div className="day-timer-progress">
        <div className="day-timer-fill" style={{ width: `${dayProgress}%` }} />
      </div>

      {/* Challenge cards */}
      <div className="challenges-grid">
        {filtered.map(challenge => {
          const uc = getProgress(challenge.id);
          const progress = uc?.progress || 0;
          const pct = challenge.target_count > 0 ? (progress / challenge.target_count) * 100 : 0;
          const isDone = uc?.is_completed;
          const catName = challenge.challenge_categories?.name || '';
          const gradStart = challenge.challenge_categories?.gradient_start || '#f07147';
          const gradEnd = challenge.challenge_categories?.gradient_end || '#ff9f43';
          const verifyType = challenge.verification_type || 'self_report';
          const verifyInfo = VERIFY_LABELS[verifyType] || VERIFY_LABELS.self_report;

          // 1. Check Mystery visibility
          if (challenge.visibility === 'mystery') {
            return (
              <div
                key={challenge.id}
                className="challenge-card mystery"
                style={{ cursor: 'not-allowed', opacity: 0.7 }}
              >
                <div
                  className="challenge-icon"
                  style={{ background: 'rgba(0,0,0,0.05)', color: '#94a3b8' }}
                >
                  <HelpOutlineIcon />
                </div>
                <div className="challenge-content">
                  <div className="challenge-title" style={{ fontFamily: 'var(--font-heading)', color: '#94a3b8' }}>
                    ???
                    <span className="challenge-verify-badge self-report" style={{ background: '#e2e8f0', color: '#94a3b8' }}>
                      Tajanstveno
                    </span>
                  </div>
                  <div className="challenge-desc">Navika pod upitnikom. Riješi ostale navike da se otkrije! 🕵️</div>
                </div>
              </div>
            );
          }

          // 2. Check Coming Soon visibility
          if (challenge.visibility === 'coming_soon') {
            return (
              <div
                key={challenge.id}
                className="challenge-card coming-soon"
                style={{
                  cursor: 'not-allowed',
                  opacity: 0.8,
                  borderColor: 'var(--prisa-blue-pastel)',
                  background: 'var(--prisa-blue-light)'
                }}
              >
                <div
                  className="challenge-icon"
                  style={{ background: 'var(--prisa-blue-pastel)', color: 'var(--prisa-blue)' }}
                >
                  {getCategoryIcon(challenge.challenge_categories)}
                </div>
                <div className="challenge-content">
                  <div className="challenge-title" style={{ color: 'var(--prisa-blue)' }}>
                    {challenge.title}
                    <span className="challenge-verify-badge" style={{ background: 'var(--prisa-blue)', color: '#fff' }}>
                      Uskoro
                    </span>
                  </div>
                  <div className="challenge-desc">{challenge.description}</div>
                  {challenge.start_date && (
                    <div style={{
                      marginTop: 8,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--prisa-blue)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      ⏳ {formatDate(challenge.start_date)}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // 3. Regular Visible card
          return (
            <div
              key={challenge.id}
              className={`challenge-card ${isDone ? 'completed' : ''}`}
              onClick={() => !isDone && setSelectedChallenge(challenge)}
            >
              <div
                className="challenge-icon"
                style={{ background: `linear-gradient(135deg, ${gradStart}22, ${gradEnd}22)`, color: gradStart }}
              >
                {getCategoryIcon(challenge.challenge_categories)}
              </div>
              <div className="challenge-content">
                <div className="challenge-title">
                  {isDone && <CheckCircleIcon style={{ fontSize: 16, color: '#0d9488', verticalAlign: 'middle', marginRight: 4 }} />}
                  {challenge.title}
                  <span className={`challenge-verify-badge ${verifyInfo.cls}`}>
                    <verifyInfo.icon style={{ fontSize: 10 }} />
                    {verifyInfo.label}
                  </span>
                </div>
                <div className="challenge-desc">{challenge.description}</div>
                <div className="challenge-progress-bar">
                  <div
                    className="challenge-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${gradStart}, ${gradEnd})`,
                    }}
                  />
                </div>
                <div className="challenge-meta">
                  <span className="challenge-progress-text">{progress} / {challenge.target_count} {challenge.unit || ''}</span>
                  <span className="challenge-xp-badge">⚡ {challenge.xp_reward} XP</span>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Nema navika u ovoj kategoriji.
          </div>
        )}
      </div>

      {/* Challenge Detail Drawer */}
      <Drawer 
        isOpen={!!selectedChallenge} 
        onClose={() => {
          setSelectedChallenge(null);
          setFieldValue('');
          setPhotoFile(null);
          setPhotoPreview(null);
        }}
        title="Detalji navike"
      >
        {selectedChallenge && (
          <div className="challenge-detail-content">
            <div className="challenge-detail-header">
              <div className="card-icon-circle orange">
                {getCategoryIcon(selectedChallenge.challenge_categories)}
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.2rem' }}>
                  {selectedChallenge.title}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                  {selectedChallenge.description}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="challenge-xp-badge">⚡ {selectedChallenge.xp_reward} XP</span>
              <span className="challenge-xp-badge" style={{ background: 'var(--prisa-blue-light)', color: 'var(--prisa-blue)' }}>
                🎯 Trenutno: {getProgress(selectedChallenge.id)?.progress || 0} / {selectedChallenge.target_count} {selectedChallenge.unit || ''}
              </span>
            </div>

            {/* Self Report (Tap to Increment) */}
            {(selectedChallenge.verification_type === 'self_report' || !selectedChallenge.verification_type) && (
              <button
                className="btn btn-primary btn-block btn-large"
                onClick={() => handleSelfReport(selectedChallenge)}
                disabled={submitting}
              >
                {submitting ? <span className="loading-spinner" /> : `➕ Zabilježi napredak (+1)`}
              </button>
            )}

            {/* Field Input */}
            {selectedChallenge.verification_type === 'field_input' && (
              <div className="challenge-field-input">
                <div className="form-group">
                  <label>
                    {selectedChallenge.input_question || `Koliko si danas napravio/la? (${selectedChallenge.unit})`}
                  </label>
                  <input
                    type="number"
                    value={fieldValue}
                    onChange={e => setFieldValue(e.target.value)}
                    placeholder={`npr. ${selectedChallenge.target_count}`}
                    min="1"
                  />
                </div>
                <button
                  className="btn btn-primary btn-block btn-large"
                  onClick={() => handleFieldSubmit(selectedChallenge)}
                  disabled={submitting || !fieldValue}
                >
                  {submitting ? <span className="loading-spinner" /> : '📝 Spremi napredak'}
                </button>
              </div>
            )}

            {/* Photo Upload */}
            {selectedChallenge.verification_type === 'photo_upload' && (
              <div className="challenge-photo-upload">
                {!photoPreview ? (
                  <label className="photo-upload-area">
                    <PhotoCameraIcon />
                    <div className="photo-upload-text">Klikni za upload fotografije</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                ) : (
                  <div>
                    <img src={photoPreview} alt="Preview" className="photo-preview" />
                    <div className="pending-approval-badge" style={{ marginTop: 12 }}>
                      ⏳ Čeka odobrenje admina
                    </div>
                  </div>
                )}
                <button
                  className="btn btn-primary btn-block btn-large"
                  onClick={() => handlePhotoSubmit(selectedChallenge)}
                  disabled={submitting || !photoFile}
                  style={{ marginTop: 16 }}
                >
                  {submitting ? <span className="loading-spinner" /> : '📸 Pošalji dokaz'}
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
