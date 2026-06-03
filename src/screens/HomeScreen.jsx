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
  
  // Pick deterministically based on hour
  const hourSeed = (new Date().getHours() + new Date().getDate()) % pool.length;
  return pool[hourSeed];
}

export default function HomeScreen({ onNavigate }) {
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [countdown, setCountdown] = useState('');
  const [dailyQuote, setDailyQuote] = useState(null);
  const [levelInfo, setLevelInfo] = useState({ name: 'Početnik', icon: '🐣' });
  const [actionsCount, setActionsCount] = useState(0);
  const [arenaEnabled, setArenaEnabled] = useState(false);

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
      let { data: quote } = await supabase
        .from('daily_quotes')
        .select('*')
        .eq('scheduled_date', today)
        .eq('is_active', true)
        .limit(1)
        .single();

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

      // 3. Fetch actions count (number of logged challenge entries)
      if (profile) {
        const { count } = await supabase
          .from('user_challenges')
          .select('id', { count: 'exact' })
          .eq('user_id', profile.id);
        
        if (count !== null) setActionsCount(count);
      }

      // 4. Fetch Arena Enabled setting
      const { data: arenaSetting } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'arena_enabled')
        .single();
      
      if (arenaSetting && arenaSetting.value) {
        setArenaEnabled(arenaSetting.value.enabled === true || arenaSetting.value === true);
      }
    };
    fetchData();
  }, [profile, level]);

  const greeting = getGreetingData();

  const stats = [
    { icon: <LocalFireDepartmentIcon />, value: `${profile?.streak || 0} 🔥`, label: 'Vatrice', bg: '#fff0eb', color: '#f07147' },
    { icon: <span>{levelInfo.icon}</span>, value: levelInfo.name, label: `Razina ${level}`, bg: '#dbeafe', color: '#3b82f6' },
    { icon: <EmojiEventsIcon />, value: actionsCount, label: 'Akcije', bg: '#ccfbf1', color: '#0d9488' },
    { icon: <BoltIcon />, value: `${profile?.xp || 0} ⚡`, label: 'Ukupno XP', bg: '#ffedd5', color: '#f07147' },
  ];

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-card-bg" />
        <div className="hero-greeting">{greeting.g}, {profile?.name?.split(' ')[0] || 'Korisnik'} 👋</div>
        <div className="hero-welcome">{greeting.s}</div>

        {/* Daily quote lifted to the top */}
        {dailyQuote && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            margin: '14px 0',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff'
          }}>
            <div style={{ fontStyle: 'italic', fontSize: '0.82rem', lineHeight: 1.4, fontWeight: 500 }}>
              "{dailyQuote.text}"
            </div>
            {dailyQuote.author && (
              <div style={{ fontSize: '0.72rem', textAlign: 'right', marginTop: 4, opacity: 0.8, fontWeight: 700 }}>
                — {dailyQuote.author}
              </div>
            )}
          </div>
        )}

        <div className="xp-section">
          <XpRing
            level={level}
            xpInto={xpIntoLevel}
            xpTotal={xpForNext}
            animatedXp={animatedXp}
          />
          <div className="xp-info">
            <h3>{animatedXp} XP</h3>
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
          <div key={i} className="stat-tile">
            <div className="stat-tile-icon" style={{ background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-tile-value" style={{ fontSize: '0.9rem', fontWeight: 800 }}>{s.value}</div>
              <div className="stat-tile-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
}
