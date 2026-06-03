import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import XpRing from '../components/ui/XpRing';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';

function pad(n) { return String(n).padStart(2, '0'); }

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
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [countdown, setCountdown] = useState('');
  const [dailyQuote, setDailyQuote] = useState(null);
  const [levelInfo, setLevelInfo] = useState({ name: 'Početnik', icon: '🐣' });
  const [achievementsRatio, setAchievementsRatio] = useState({ unlocked: 0, total: 0 });
  const [arenaEnabled, setArenaEnabled] = useState(false);
  const [showLevelProgression, setShowLevelProgression] = useState(false);
  const [greeting] = useState(() => getGreetingData());

  const totalXp = profile?.xp || 0;
  const level = Math.floor(totalXp / 500) + 1;
  const xpIntoLevel = totalXp % 500;
  const xpForNext = 500;

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

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
      const today = new Date().toISOString().split('T')[0];
      
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
      const { data: levels } = await supabase.from('levels').select('*');
      if (levels) {
        const match = levels.find(l => l.level === level);
        if (match) setLevelInfo(match);
        else setLevelInfo({ name: `Razina ${level}`, icon: '⭐' });
      }

      // 3. Fetch achievements ratio (unlocked / total)
      if (profile) {
        // Fetch total achievements (where visibility is not 'hidden')
        const { data: totalAch } = await supabase
          .from('achievements')
          .select('id')
          .neq('visibility', 'hidden');
        
        // Fetch user's unlocked achievements
        const { data: userAch } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', profile.id);

        const totalCount = totalAch ? totalAch.length : 0;
        const unlockedCount = userAch ? userAch.length : 0;
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
  }, [profile, level]);

  // greeting is stored in state to remain stable

  const stats = [
    { icon: <LocalFireDepartmentIcon />, value: `${profile?.streak || 0} 🔥`, label: 'Vatrice', bg: '#fff0eb', color: '#f07147' },
    { icon: <span>{levelInfo.icon}</span>, value: levelInfo.name, label: `Razina ${level}`, bg: '#dbeafe', color: '#3b82f6', isLevel: true },
    { icon: <EmojiEventsIcon />, value: `${achievementsRatio.unlocked} / ${achievementsRatio.total}`, label: 'Izazovi', bg: '#ccfbf1', color: '#0d9488' },
    { icon: <BoltIcon />, value: `${profile?.xp || 0} ⚡`, label: 'Ukupno XP', bg: '#ffedd5', color: '#f07147' },
  ];

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-card-bg" />
        <div className="hero-greeting">{greeting.g}, {profile?.name?.split(' ')[0] || 'Korisnik'} 👋</div>
        <div className="hero-welcome">{greeting.s}</div>

        <div className="xp-section">
          <XpRing
            level={level}
            xpInto={xpIntoLevel}
            xpTotal={xpForNext}
            animatedXp={animatedXp}
          />
          <div className="xp-info">
            {/* Large Level badge - full width mobile optimized */}
            <div 
              onClick={() => setShowLevelProgression(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: '#f8fafc',
                padding: '10px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid #e2e8f0',
                cursor: 'pointer',
                marginBottom: '12px',
                width: '100%',
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#f8fafc';
              }}
              title="Vidi razine i napredak"
            >
              <div style={{ fontSize: '1.6rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{levelInfo.icon}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)', letterSpacing: '0.5px' }}>
                  {levelInfo.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', fontWeight: 600 }}>
                  Pogledaj put razina
                </span>
              </div>
            </div>

            <h3 style={{ marginTop: '2px' }}>{animatedXp} XP</h3>
            <p>{xpIntoLevel} / {xpForNext} do razine {level + 1}</p>
            <div className="xp-progress-bar">
              <div
                className="xp-progress-fill"
                style={{ width: `${(xpIntoLevel / xpForNext) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hero-bottom-row">
          <div className="countdown-chip">
            <TimerIcon />
            Reset: {countdown}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div 
            key={i} 
            className="stat-tile"
            onClick={s.isLevel ? () => setShowLevelProgression(true) : undefined}
            style={s.isLevel ? { 
              cursor: 'pointer', 
              border: '1.5px solid var(--prisa-orange)', 
              boxShadow: '0 4px 12px rgba(240, 113, 71, 0.12)',
              transition: 'transform 0.2s var(--ease)'
            } : {}}
            onMouseEnter={(e) => {
              if (s.isLevel) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              if (s.isLevel) e.currentTarget.style.transform = 'none';
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
          padding: '16px 20px',
          margin: '20px 0',
          border: '1.5px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--text-dark)',
          position: 'relative'
        }}>
          {/* Notebook paper style detail */}
          <div style={{
            position: 'absolute',
            left: '4px',
            top: '0',
            bottom: '0',
            width: '2px',
            borderLeft: '1px dashed #ffb3a7',
          }} />
          <div style={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.5, fontWeight: 500, paddingLeft: '8px' }}>
            "{dailyQuote.text}"
          </div>
          {dailyQuote.author && (
            <div style={{ fontSize: '0.85rem', textAlign: 'right', marginTop: 6, opacity: 0.8, fontWeight: 700, color: 'var(--prisa-orange)' }}>
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
                Put Razine ⚔️
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
                {DEFAULT_LEVELS.map((item) => {
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

