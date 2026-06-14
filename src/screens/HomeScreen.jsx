import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';

function pad(n) { return String(n).padStart(2, '0'); }

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatName = (name) => {
  if (!name) return 'Korisnik';
  if (name.includes('.')) {
    return name.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return name;
};

const getFirstName = (name) => formatName(name).split(' ')[0];

const DEFAULT_LEVELS = [
  { level: 1, name: 'Početnik', icon: '🐣', xp: 0 },
  { level: 2, name: 'Tragač', icon: '🔍', xp: 500 },
  { level: 3, name: 'Učenik', icon: '📚', xp: 1000 },
  { level: 4, name: 'Navigator', icon: '🧭', xp: 1500 },
  { level: 5, name: 'Strijelac', icon: '🏹', xp: 2000 },
  { level: 6, name: 'Ratnik', icon: '⚔️', xp: 2500 },
  { level: 7, name: 'Majstor', icon: '🎓', xp: 3000 },
  { level: 8, name: 'Prvak', icon: '🏆', xp: 3500 },
  { level: 9, name: 'Legenda', icon: '👑', xp: 4000 },
  { level: 10, name: 'Besmrtnik', icon: '🌌', xp: 4500 }
];

function getGreetingData() {
  const h = new Date().getHours();
  
  const morningGreetings = [
    { g: 'Dobro jutro', s: 'Vrijeme je za prvu kavu i nove navike! ☕' },
    { g: 'Jutarnja inspiracija', s: 'Jutro je pametnije od večeri. Krenimo u akciju! 🌅' },
    { g: 'Novi dan pred tobom', s: 'Novi dan, nova prilika za pobjedu nad navikama! 🚀' }
  ];
  
  const afternoonGreetings = [
    { g: 'Dobar dan', s: 'Polovica je dana. Jesi li odradio današnje navike? ☀️' },
    { g: 'Dobar dan, nastavi jako', s: 'Odlično ti ide, samo nastavi neposustajući! 💪' },
    { g: 'Navike u tijeku', s: 'Vrijeme je za kratku pauzu i čašu vode. 💧' }
  ];
  
  const eveningGreetings = [
    { g: 'Dobra večer', s: 'Dan privodimo kraju. Jesi li odradio sve planirano? 🌙' },
    { g: 'Večernja rekapitulacija', s: 'Vrijeme je za analizu i ugodno opuštanje. 🧘' },
    { g: 'Sjajan posao danas', s: 'Sjajan posao danas. Odmori se i pripremi za sutra! 🛌' }
  ];
  
  let pool = afternoonGreetings;
  if (h < 12) pool = morningGreetings;
  else if (h >= 18) pool = eveningGreetings;
  
  // Pick randomly on render
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export default function HomeScreen({ onNavigate }) {
  const { profile, refreshProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [countdown, setCountdown] = useState('');
  const [dailyQuote, setDailyQuote] = useState(null);
  const [levelInfo, setLevelInfo] = useState({ name: 'Početnik', icon: '🐣' });
  const [achievementsRatio, setAchievementsRatio] = useState({ unlocked: 0, total: 0 });
  const [arenaEnabled, setArenaEnabled] = useState(false);
  const [showLevelProgression, setShowLevelProgression] = useState(false);
  const [greeting] = useState(() => getGreetingData());
  const [progressPct, setProgressPct] = useState(0);

  const [progression, setProgression] = useState({ xpIntoLevel: 0, xpForNext: 500 });
  const [dbLevels, setDbLevels] = useState(DEFAULT_LEVELS);

  const totalXp = profile?.xp || 0;
  const level = profile?.level || 1;
  const xpIntoLevel = progression.xpIntoLevel;
  const xpForNext = progression.xpForNext;

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Progress ring animation
  useEffect(() => {
    if (!mounted) return;
    const targetPct = xpIntoLevel / xpForNext;
    const t = setTimeout(() => {
      setProgressPct(targetPct);
    }, 150);
    return () => clearTimeout(t);
  }, [mounted, xpIntoLevel, xpForNext]);

  // XP count-up
  useEffect(() => {
    if (!mounted) return;
    const steps = 50;
    const duration = 1400;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedXp(Math.round(totalXp * eased));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [mounted, totalXp]);

  // Countdown to UTC+2 midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utc2 = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zagreb' }));
      const tomorrow = new Date(utc2);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - utc2;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const today = getLocalDateString();
      
      // 1. Fetch quote
      let { data: quotesList } = await supabase
        .from('daily_quotes')
        .select('*')
        .eq('scheduled_date', today)
        .eq('is_active', true)
        .limit(1);

      let quote = quotesList && quotesList.length > 0 ? quotesList[0] : null;

      if (!quote) {
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const { data: quotes } = await supabase
          .from('daily_quotes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (quotes && quotes.length > 0) {
          quote = quotes[dayOfYear % quotes.length];
        }
      }
      if (quote) setDailyQuote(quote);

      // 2. Fetch custom levels
      const currentLevel = profile?.level || 1;
      const { data: levels } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });
      if (levels) {
        if (levels.length > 0) setDbLevels(levels);
        const match = levels.find(l => l.level === currentLevel);
        if (match) setLevelInfo(match);
        else setLevelInfo({ name: `Razina ${currentLevel}`, icon: '⭐', xp: (currentLevel - 1) * 500 });

        const currentLvlInfo = levels.find(l => l.level === currentLevel) || { xp: (currentLevel - 1) * 500 };
        const nextLvlInfo = levels.find(l => l.level === currentLevel + 1) || { xp: (currentLvlInfo.xp || 0) + 500 };

        const currentThreshold = currentLvlInfo.xp || 0;
        const nextThreshold = nextLvlInfo.xp || 500;

        const calculatedXpIntoLevel = Math.max(0, totalXp - currentThreshold);
        const calculatedXpForNext = Math.max(1, nextThreshold - currentThreshold);

        setProgression({
          xpIntoLevel: calculatedXpIntoLevel,
          xpForNext: calculatedXpForNext
        });
      }

      // 3. Fetch challenges (for auto-complete) & achievements ratio
      if (profile) {
        const todayStr = getLocalDateString();
        const [chalRes, ucRes, totalAchRes, userAchRes] = await Promise.all([
          supabase
            .from('challenges')
            .select('id, is_daily, active_from_time, active_to_time, auto_complete_on_open, title, xp_reward, target_count')
            .eq('visibility', 'visible'),
          supabase
            .from('user_challenges')
            .select('challenge_id, is_completed, date')
            .eq('user_id', profile.id),
          supabase
            .from('achievements')
            .select('id')
            .neq('visibility', 'hidden'),
          supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', profile.id)
        ]);

        const activeChalsList = chalRes.data || [];
        const userChalsList = ucRes.data || [];

        // Auto-complete challenges that are due
        const localTime = new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Europe/Zagreb' });
        let didAutoCompleteAny = false;

        for (const chal of activeChalsList) {
          if (chal.auto_complete_on_open && chal.active_from_time && chal.active_to_time) {
            const alreadyCompleted = userChalsList.some(uc => uc.challenge_id === chal.id && uc.is_completed && uc.date === todayStr);
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
                console.log(`Auto-completing: ${chal.title}`);
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
        }

        // Set achievements ratio
        const totalCount = totalAchRes.data ? totalAchRes.data.length : 0;
        const unlockedCount = userAchRes.data ? userAchRes.data.length : 0;
        setAchievementsRatio({ unlocked: unlockedCount, total: totalCount });
      }

      // 4. Fetch Arena Enabled setting
      const { data: settingsList } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'arena_enabled')
        .limit(1);
      
      const arenaSetting = settingsList && settingsList.length > 0 ? settingsList[0] : null;
      
      if (arenaSetting && arenaSetting.value) {
        setArenaEnabled(arenaSetting.value.enabled === true || arenaSetting.value === true);
      }
    };
    fetchData();
  }, [profile]);

  // greeting is stored in state to remain stable

  const stats = [
    { icon: <LocalFireDepartmentIcon />, value: `${profile?.streak || 0} 🔥`, label: 'Vatrice', bg: '#fff0eb', color: '#f07147' },
    { icon: <span>{levelInfo.icon}</span>, value: levelInfo.name, label: `Razina ${level}`, bg: '#dbeafe', color: '#3b82f6', isLevel: true },
    { 
      icon: <EmojiEventsIcon />, 
      value: `${achievementsRatio.unlocked} / ${achievementsRatio.total}`, 
      label: 'Postignuća', 
      bg: '#ccfbf1', 
      color: '#0d9488',
      onClick: () => onNavigate(4)
    },
    { icon: <BoltIcon />, value: `${profile?.xp || 0} ⚡`, label: 'Ukupno XP', bg: '#ffedd5', color: '#f07147' },
  ];

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      {/* Hero card — dark premium glassmorphic */}
      <div className="hero-card">
        <div className="hero-card-bg" />
        <p className="hero-greeting">{greeting.g}, {getFirstName(profile?.name)} <span style={{ display: 'inline-block', transformOrigin: '70% 70%', animation: 'wave 2.4s ease-in-out infinite' }}>👋</span></p>

        {/* Split greeting subtitle so we can apply gradient accent */}
        {(() => {
          const text = greeting.s;
          // Try splitting on the last emoji or exclamation
          const parts = text.split(/(?=\s[\u{1F300}-\u{1FAFF}])/u);
          if (parts.length > 1) {
            return (
              <h1 className="hero-welcome">
                {parts[0]} <span className="accent">{parts.slice(1).join('')}</span>
              </h1>
            );
          }
          return <h1 className="hero-welcome">{text}</h1>;
        })()}

        <div className="hero-inner-card">
          {/* Level top — ring + level meta */}
          <div className="hero-level-top">
            <div className="hero-ring-wrap">
               <svg width="120" height="120" viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 8px 16px rgba(255, 107, 74, 0.2))' }}>
                 <defs>
                   <linearGradient id="hero-ring-grad" x1="0" y1="0" x2="1" y2="1">
                     <stop offset="0" stopColor="#ffb703"/>
                     <stop offset="0.5" stopColor="#ff6b4a"/>
                     <stop offset="1" stopColor="#fb8500"/>
                   </linearGradient>
                   <filter id="hero-ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur stdDeviation="4" result="blur" />
                     <feComponentTransfer in="blur" result="glow">
                       <feFuncA type="linear" slope="0.75"/>
                     </feComponentTransfer>
                     <feMerge>
                       <feMergeNode in="glow" />
                       <feMergeNode in="SourceGraphic" />
                     </feMerge>
                   </filter>
                 </defs>
                 <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="12"/>
                 <circle cx="60" cy="60" r="50" fill="none" stroke="url(#hero-ring-grad)" strokeWidth="12"
                   strokeLinecap="round"
                   filter="url(#hero-ring-glow)"
                   strokeDasharray={2 * Math.PI * 50}
                   strokeDashoffset={2 * Math.PI * 50 - progressPct * 2 * Math.PI * 50}
                   style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                 />
               </svg>
              <div className="hero-ring-center">
                <b>{level}</b>
                <span>RAZINA</span>
              </div>
            </div>

            <div className="hero-level-meta">
              <div className="badge-row">
                <span className="level-icon">{levelInfo.icon}</span>
                <span className="level-name">{levelInfo.name}</span>
              </div>
              <button className="level-link" onClick={() => setShowLevelProgression(true)}>
                Pogledaj Put Ratnika →
              </button>
            </div>
          </div>

          {/* XP section */}
          <div className="hero-xp">
            <div className="hero-xp-num">{animatedXp} <small>XP</small></div>
            <div className="hero-xp-sub">{xpIntoLevel} / {xpForNext} do razine {level + 1}</div>
            <div className="hero-xp-bar">
              <i className="hero-xp-bar-fill" style={{ '--pct': `${(xpIntoLevel / xpForNext) * 100}%` }}></i>
            </div>
          </div>

          {/* Reset countdown */}
          <div className="hero-reset-row">
            ⏱️ Reset za <span className="timer-value">{countdown}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div 
            key={i} 
            className="stat-tile"
            onClick={s.isLevel ? () => setShowLevelProgression(true) : s.onClick}
            style={s.isLevel || s.onClick ? { 
              cursor: 'pointer', 
              border: s.isLevel ? '1.5px solid var(--prisa-orange)' : '1.5px solid #0d9488', 
              boxShadow: s.isLevel ? '0 4px 12px rgba(240, 113, 71, 0.12)' : '0 4px 12px rgba(13, 148, 136, 0.12)',
              transition: 'transform 0.2s var(--ease)'
            } : {}}
            onMouseEnter={(e) => {
              if (s.isLevel || s.onClick) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              if (s.isLevel || s.onClick) e.currentTarget.style.transform = 'none';
            }}
          >
            <div className="stat-tile-icon" style={{ background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-tile-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{s.value}</div>
              <div className="stat-tile-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily quote block - moved to bottom above CTAs */}
      {dailyQuote && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          margin: '24px 0',
          border: '1.5px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--text-dark)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Notebook paper style detail */}
          <div style={{
            position: 'absolute',
            left: '5px',
            top: '0',
            bottom: '0',
            width: '2px',
            borderLeft: '1.5px dashed #ffa090',
          }} />

          {/* Large Quote Watermark */}
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '-10px',
            fontSize: '6rem',
            fontFamily: 'Georgia, serif',
            color: 'rgba(240, 113, 71, 0.07)',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            ”
          </span>

          <div style={{ 
            fontFamily: 'var(--font-hand)', 
            fontSize: '1.5rem', 
            lineHeight: 1.35, 
            fontWeight: 600, 
            paddingLeft: '12px',
            color: '#1e293b'
          }}>
            “{dailyQuote.text}”
          </div>
          {dailyQuote.author && (
            <div style={{ 
              fontSize: '0.85rem', 
              textAlign: 'right', 
              marginTop: 8, 
              opacity: 0.9, 
              fontWeight: 800, 
              color: 'var(--prisa-orange)',
              fontFamily: 'var(--font-body)'
            }}>
              — {dailyQuote.author}
            </div>
          )}
        </div>
      )}

      {/* CTA cards */}
      <div
        className="cta-card"
        onClick={() => onNavigate(1)}
      >
        <div className="card-icon-circle orange">
          <EmojiEventsIcon />
        </div>
        <div className="cta-card-content">
          <div className="cta-card-title">Dnevne navike</div>
          <div className="cta-card-text">Osvoji XP bodove danas!</div>
        </div>
        <ArrowForwardIcon className="cta-card-arrow" />
      </div>

      {arenaEnabled && (
        <div
          className="cta-card"
          onClick={() => onNavigate(2)}
        >
          <div className="card-icon-circle blue">
            <SportsKabaddiIcon />
          </div>
          <div className="cta-card-content">
            <div className="cta-card-title">Arena</div>
            <div className="cta-card-text">Izazovi suparnika 1v1!</div>
          </div>
          <ArrowForwardIcon className="cta-card-arrow" />
        </div>
      )}

      {/* Level Progression road modal (Clash Royale Style) */}
      {showLevelProgression && (
        <div className="dialog-overlay" onClick={() => setShowLevelProgression(false)}>
          <div 
            className="dialog-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '24px',
              maxWidth: '420px',
              background: '#fcfaf7', /* notebook paper warm color */
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                Put Ratnika ⚔️
              </h2>
              <button 
                onClick={() => setShowLevelProgression(false)}
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

            {/* Subtitle */}
            <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', marginBottom: '18px', lineHeight: 1.4 }}>
              Skupljaj XP bodove i napreduj kroz razine. Svaka nova razina donosi novu titulu i status u zajednici!
            </p>

            {/* Scrollable road */}
            <div 
              style={{ 
                flex: 1,
                overflowY: 'auto', 
                borderRadius: 'var(--radius-md)',
                background: '#fff',
                border: '1.5px solid var(--border-color)'
              }}
            >
              {/* Inner relative container to hold absolute path line and items, extending to full scroll height */}
              <div style={{ position: 'relative', padding: '24px 20px' }}>
                {/* Vertical path line */}
                <div style={{
                  position: 'absolute',
                  left: '44px', /* centered to the 48px circle badge: padding 20px + 24px half-width = 44px */
                  top: '44px', /* starts exactly at center of first circle (padding-top 24px + 20px offset) */
                  bottom: '44px', /* ends exactly at center of last circle */
                  width: '4px',
                  background: 'transparent',
                  backgroundImage: 'linear-gradient(to bottom, #3b82f6 50%, rgba(255,255,255,0) 0%)',
                  backgroundPosition: 'left',
                  backgroundSize: '4px 14px',
                  backgroundRepeat: 'repeat-y',
                  zIndex: 1
                }} />

                {/* Levels mapping */}
                {dbLevels.map((item) => {
                  const isActive = item.level === level;
                  const isUnlocked = item.level < level;
                  const isLocked = item.level > level;
                  
                  return (
                    <div 
                      key={item.level} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '20px',
                        position: 'relative',
                        zIndex: 2
                      }}
                    >
                      {/* Circle badge */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: isActive 
                          ? 'var(--prisa-orange)' 
                          : isUnlocked 
                            ? '#10b981' 
                            : '#e2e8f0',
                        border: isActive 
                          ? '4px solid #fff' 
                          : '2px solid var(--border-color)',
                        boxShadow: isActive ? '0 0 10px rgba(240, 113, 71, 0.6)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: isActive || isUnlocked ? '#fff' : 'var(--text-muted)',
                        flexShrink: 0,
                        marginRight: '20px'
                      }}>
                        {isActive ? item.icon : isUnlocked ? '✓' : item.icon}
                      </div>

                      {/* Level Details */}
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontFamily: 'var(--font-heading)', 
                            fontWeight: 800, 
                            fontSize: '1rem',
                            color: isActive ? 'var(--prisa-orange)' : 'var(--text-dark)'
                          }}>
                            {item.name}
                          </span>
                          {isActive && (
                            <span style={{ 
                              background: 'var(--prisa-orange-light)', 
                              color: 'var(--prisa-orange)', 
                              fontSize: '0.62rem', 
                              fontWeight: 800, 
                              padding: '2px 8px', 
                              borderRadius: '10px',
                              textTransform: 'uppercase'
                            }}>
                              Tvoja
                            </span>
                          )}
                          {isLocked && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔒</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <span>Razina {item.level}</span>
                          <span>{item.xp} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button 
                className="btn btn-primary btn-block btn-large"
                onClick={() => setShowLevelProgression(false)}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

