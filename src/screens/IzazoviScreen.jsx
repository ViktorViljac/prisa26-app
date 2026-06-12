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

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const checkTimeWindow = (from, to) => {
  if (!from || !to) return true;
  const localTime = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Europe/Zagreb' });
  if (from <= to) {
    return (localTime >= from && localTime <= to);
  } else {
    return (localTime >= from || localTime <= to);
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  return `${parts[0]}:${parts[1]}`;
};

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
  const [tappingId, setTappingId] = useState(null); // tracks which card is being tapped
  const [justDoneId, setJustDoneId] = useState(null); // for success flash animation

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

      // Auto-complete challenges that are due
      if (profile && chalRes.data && ucRes.data) {
        const todayStr = getLocalDateString();
        const localTime = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Europe/Zagreb' });
        let didAutoCompleteAny = false;

        for (const chal of chalRes.data) {
          if (chal.auto_complete_on_open && chal.active_from_time && chal.active_to_time) {
            const alreadyCompleted = ucRes.data.some(uc => uc.challenge_id === chal.id && uc.is_completed && uc.date === todayStr);
            if (!alreadyCompleted) {
              const from = chal.active_from_time;
              const to = chal.active_to_time;
              let inTimeWindow = false;
              if (from <= to) {
                inTimeWindow = (localTime >= from && localTime <= to);
              } else {
                inTimeWindow = (localTime >= from || localTime <= to);
              }

              if (inTimeWindow) {
                console.log(`Auto-completing in IzazoviScreen: ${chal.title}`);
                await supabase.from('user_challenges').upsert({
                  user_id: profile.id,
                  challenge_id: chal.id,
                  progress: chal.target_count || 1,
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                  date: todayStr
                }, { onConflict: 'user_id,challenge_id,date' });

                await supabase.rpc('award_xp', {
                  p_user_id: profile.id,
                  p_xp_amount: (chal.xp_reward || 10) * (chal.target_count || 1)
                });

                didAutoCompleteAny = true;
              }
            }
          }
        }

        if (didAutoCompleteAny) {
          await refreshProfile();
          const { data: freshUc } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
          if (freshUc) setUserChallenges(freshUc);
        }
      }
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

  const today = getLocalDateString();

  // Count completed / total challenges dynamically
  const visibleChallenges = challenges.filter(c => c.visibility === 'visible');

  // Denominator: all visible daily challenges + visible non-daily challenges that are NOT completed yet, OR completed today
  const activeChallengesToday = visibleChallenges.filter(c => {
    if (c.is_daily) return true;
    const completedRecord = userChallenges.find(uc => uc.challenge_id === c.id && uc.is_completed);
    if (!completedRecord) return true;
    return completedRecord.date === today;
  });

  const totalVisible = activeChallengesToday.length;

  // Numerator: completed today (either a daily challenge completed today, or a non-daily challenge completed today)
  const completedTodayIds = new Set(
    userChallenges
      .filter(uc => uc.is_completed && uc.date === today && visibleChallenges.some(vc => vc.id === uc.challenge_id))
      .map(uc => uc.challenge_id)
  );
  const completed = completedTodayIds.size;

  const getProgress = (challengeId) => {
    const chal = challenges.find(c => c.id === challengeId);
    if (!chal) return null;
    
    if (chal.is_daily) {
      // Daily challenge — progress is only for today
      return userChallenges.find(u => u.challenge_id === challengeId && u.date === today) || null;
    } else {
      // One-time challenge — find the latest progress record across all days
      const records = userChallenges.filter(u => u.challenge_id === challengeId);
      if (records.length === 0) return null;
      // If any record is completed, return that one
      const completedRecord = records.find(u => u.is_completed);
      if (completedRecord) return completedRecord;
      // Otherwise return the one with the maximum progress, or the latest one
      return records.sort((a, b) => b.progress - a.progress)[0];
    }
  };

  const handleSelfReport = async (challenge, fromCard = false) => {
    if (!profile) return;
    if (fromCard) {
      setTappingId(challenge.id);
    } else {
      setSubmitting(true);
    }
    try {
      const today = getLocalDateString();
      const existing = getProgress(challenge.id);
      const prevProgress = existing?.progress || 0;
      const newProgress = Math.min(prevProgress + 1, challenge.target_count);
      const isDone = newProgress >= challenge.target_count;
      const prevLevel = profile?.level || 1;
      const dateToUse = challenge.is_daily ? today : (existing?.date || today);

      const { error } = await supabase.from('user_challenges').upsert({
        user_id: profile.id,
        challenge_id: challenge.id,
        progress: newProgress,
        is_completed: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        date: dateToUse,
      }, { onConflict: 'user_id,challenge_id,date' });

      if (!error) {
        const increment = newProgress - prevProgress;
        if (increment > 0) {
          await supabase.rpc('award_xp', {
            p_user_id: profile.id,
            p_xp_amount: challenge.xp_reward * increment,
          });
        }

        // Track every tap — core research metric
        posthog.capture('habit_tapped', {
          habit_id: challenge.id,
          habit_title: challenge.title,
          habit_category: challenge.challenge_categories?.name || 'Unknown',
          verification_type: 'self_report',
          progress_before: prevProgress,
          progress_after: newProgress,
          target: challenge.target_count,
          unit: challenge.unit,
          xp_per_tap: challenge.xp_reward,
          date: today,
          from_card: fromCard,
          is_completed: isDone,
        });

        if (isDone) {
          setJustDoneId(challenge.id);
          setTimeout(() => setJustDoneId(null), 1500);
          posthog.capture('habit_completed', {
            habit_id: challenge.id,
            habit_title: challenge.title,
            habit_category: challenge.challenge_categories?.name || 'Unknown',
            verification_type: 'self_report',
            xp_reward: challenge.xp_reward,
            target_count: challenge.target_count,
            date: today,
          });
        }

        await refreshProfile();

        // Detect level up
        const freshProfile = await supabase.from('profiles').select('xp, level').eq('id', profile.id).single();
        if (freshProfile.data) {
          const newLevel = freshProfile.data.level || 1;
          if (newLevel > prevLevel) {
            posthog.capture('level_up', {
              level_from: prevLevel,
              level_to: newLevel,
              total_xp: freshProfile.data.xp,
            });
          }
        }

        const { data } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
        if (data) setUserChallenges(data);
      } else {
        posthog.capture('app_error', { context: 'self_report_upsert', error: error.message });
      }
    } catch (err) {
      console.error('Challenge completion error:', err);
      posthog.capture('app_error', { context: 'self_report_handler', error: err.message });
    }
    if (fromCard) {
      setTappingId(null);
    } else {
      setSubmitting(false);
      setSelectedChallenge(null);
    }
  };

  const handleFieldSubmit = async (challenge) => {
    if (!profile || !fieldValue) return;
    setSubmitting(true);
    try {
      const today = getLocalDateString();
      const numVal = parseInt(fieldValue) || 0;
      const existing = getProgress(challenge.id);
      const prevProgress = existing?.progress || 0;
      const newProgress = Math.min(prevProgress + numVal, challenge.target_count);
      const isDone = newProgress >= challenge.target_count;
      const dateToUse = challenge.is_daily ? today : (existing?.date || today);

      await supabase.from('user_challenges').upsert({
        user_id: profile.id,
        challenge_id: challenge.id,
        progress: newProgress,
        is_completed: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        date: dateToUse,
      }, { onConflict: 'user_id,challenge_id,date' });

      const increment = newProgress - prevProgress;
      if (increment > 0) {
        await supabase.rpc('award_xp', {
          p_user_id: profile.id,
          p_xp_amount: challenge.xp_reward * increment,
        });
      }

      // Track every field submission
      posthog.capture('habit_tapped', {
        habit_id: challenge.id,
        habit_title: challenge.title,
        habit_category: challenge.challenge_categories?.name || 'Unknown',
        verification_type: 'field_input',
        progress_before: prevProgress,
        progress_after: newProgress,
        target: challenge.target_count,
        unit: challenge.unit,
        field_value: numVal,
        xp_per_unit: challenge.xp_reward,
        date: today,
        is_completed: isDone,
      });

      if (isDone) {
        posthog.capture('habit_completed', {
          habit_id: challenge.id,
          habit_title: challenge.title,
          habit_category: challenge.challenge_categories?.name || 'Unknown',
          verification_type: 'field_input',
          xp_reward: challenge.xp_reward,
          field_value: numVal,
          target_count: challenge.target_count,
          date: today,
        });
      }

      await refreshProfile();
      const { data } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
      if (data) setUserChallenges(data);
      setFieldValue('');
    } catch (err) {
      console.error('Field submit error:', err);
      posthog.capture('app_error', { context: 'field_submit_handler', error: err.message });
    }
    setSubmitting(false);
    setSelectedChallenge(null);
  };

  const handlePhotoSubmit = async (challenge) => {
    if (!profile || !photoFile) return;
    setSubmitting(true);
    try {
      const today = getLocalDateString();
      const ext = photoFile.name.split('.').pop();
      // Deterministic path: one file per user per challenge per day (upsert replaces it)
      const filePath = `${profile.id}/challenge-proofs/${challenge.id}_${today}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Greška pri slanju fotografije. Pokušaj ponovo.');
        setSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const existing = getProgress(challenge.id);
      const newProgress = Math.min((existing?.progress || 0) + 1, challenge.target_count);
      const dateToUse = challenge.is_daily ? today : (existing?.date || today);

      const { error: upsertError } = await supabase.from('user_challenges').upsert({
        user_id: profile.id,
        challenge_id: challenge.id,
        progress: newProgress,
        is_completed: false, // Pending admin approval
        proof_url: publicUrl,
        date: dateToUse,
      }, { onConflict: 'user_id,challenge_id,date' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        alert('Greška pri spremanju napretka. Pokušaj ponovo.');
        setSubmitting(false);
        return;
      }

      posthog.capture('habit_tapped', {
        habit_id: challenge.id,
        habit_title: challenge.title,
        habit_category: challenge.challenge_categories?.name || 'Unknown',
        verification_type: 'photo_upload',
        file_size_kb: Math.round(photoFile.size / 1024),
        date: today,
        is_completed: false, // pending admin approval
      });
      posthog.capture('habit_photo_submitted', {
        habit_id: challenge.id,
        habit_title: challenge.title,
        habit_category: challenge.challenge_categories?.name || 'Unknown',
        xp_reward: challenge.xp_reward,
        file_size_kb: Math.round(photoFile.size / 1024),
        date: today,
      });

      const { data } = await supabase.from('user_challenges').select('*').eq('user_id', profile.id);
      if (data) setUserChallenges(data);

      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error('Photo submit error:', err);
      posthog.capture('app_error', { context: 'photo_submit_handler', error: err.message });
      alert('Neočekivana greška. Pokušaj ponovo.');
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
          {totalVisible > 0 ? (
            <><span>{completed}</span> / {totalVisible} odrađenih navika</>
          ) : (
            <span>Nema aktivnih navika za danas</span>
          )}
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
          const isSelfReport = verifyType === 'self_report' || !challenge.verification_type;
          const isTapping = tappingId === challenge.id;
          const isJustDone = justDoneId === challenge.id;
          const isTimeValid = checkTimeWindow(challenge.active_from_time, challenge.active_to_time);

          return (
            <div
              key={challenge.id}
              className={`challenge-card ${isDone ? 'completed' : ''} ${isSelfReport && !isDone ? 'self-report-card' : ''}`}
              onClick={() => {
                // For non-self-report or multi-target self-report that needs context: open drawer
                if (!isDone && !isSelfReport) {
                  setSelectedChallenge(challenge);
                  posthog.capture('habit_drawer_opened', {
                    habit_id: challenge.id,
                    habit_title: challenge.title,
                    habit_category: challenge.challenge_categories?.name || 'Unknown',
                    verification_type: verifyType,
                    current_progress: progress,
                    target: challenge.target_count,
                  });
                }
              }}
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
                {challenge.active_from_time && challenge.active_to_time && (
                  <div className={`challenge-time-limit ${isTimeValid ? 'active' : 'locked'}`} style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: isTimeValid ? '#10b981' : '#f59e0b'
                  }}>
                    ⏱️ {isTimeValid ? 'Dostupno još' : 'Dostupno'} od {formatTime(challenge.active_from_time)} do {formatTime(challenge.active_to_time)}
                  </div>
                )}
              </div>

              {/* One-tap button for self_report challenges */}
              {isSelfReport && !isDone && (
                <button
                  className={`card-tap-btn ${isTapping ? 'tapping' : ''} ${isJustDone ? 'just-done' : ''}`}
                  style={{
                    background: isTimeValid ? `linear-gradient(135deg, ${gradStart}, ${gradEnd})` : '#e2e8f0',
                    color: isTimeValid ? '#fff' : '#94a3b8',
                    cursor: isTimeValid ? 'pointer' : 'not-allowed'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isTimeValid) return;
                    if (!isTapping) handleSelfReport(challenge, true);
                  }}
                  disabled={isTapping || !isTimeValid}
                  aria-label="Zabilježi napredak"
                >
                  {isTapping ? (
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : isJustDone ? (
                    <CheckCircleIcon style={{ fontSize: 22 }} />
                  ) : !isTimeValid ? (
                    <span>🔒</span>
                  ) : (
                    <span className="card-tap-plus">+1</span>
                  )}
                </button>
              )}
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

            {/* Self Report challenges complete directly on the card — no drawer needed */}


            {selectedChallenge.active_from_time && selectedChallenge.active_to_time && !checkTimeWindow(selectedChallenge.active_from_time, selectedChallenge.active_to_time) && (
              <div style={{
                background: '#fef3c7',
                color: '#d97706',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: 16,
                border: '1px solid #fde68a'
              }}>
                ⚠️ Navika je zaključana. Možeš je izvršiti samo u vremenu od {formatTime(selectedChallenge.active_from_time)} do {formatTime(selectedChallenge.active_to_time)}.
              </div>
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
                    disabled={!checkTimeWindow(selectedChallenge.active_from_time, selectedChallenge.active_to_time)}
                  />
                </div>
                <button
                  className="btn btn-primary btn-block btn-large"
                  onClick={() => handleFieldSubmit(selectedChallenge)}
                  disabled={submitting || !fieldValue || !checkTimeWindow(selectedChallenge.active_from_time, selectedChallenge.active_to_time)}
                >
                  {submitting ? <span className="loading-spinner" /> : '📝 Spremi napredak'}
                </button>
              </div>
            )}

            {/* Photo Upload */}
            {selectedChallenge.verification_type === 'photo_upload' && (
              <div className="challenge-photo-upload">
                {getProgress(selectedChallenge.id)?.proof_url && !getProgress(selectedChallenge.id)?.is_completed ? (
                  <div style={{ textAlign: 'center', padding: '24px 20px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>Dokaz je poslan!</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Admin trenutno pregledava tvoju prijavu. Možeš nastaviti s drugim navikama.</div>
                  </div>
                ) : (
                  <>
                    {!photoPreview ? (
                      <label className="photo-upload-area">
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📸</div>
                        <div className="photo-upload-text">Klikni za odabir fotografije</div>
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
                      </div>
                    )}
                    <button
                      className="btn btn-primary btn-block btn-large"
                      onClick={() => handlePhotoSubmit(selectedChallenge)}
                      disabled={submitting || !photoFile || !checkTimeWindow(selectedChallenge.active_from_time, selectedChallenge.active_to_time)}
                      style={{ marginTop: 16 }}
                    >
                      {submitting ? <span className="loading-spinner" /> : '📸 Pošalji dokaz'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
