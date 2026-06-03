import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import XpRing from '../components/ui/XpRing';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import StarsIcon from '@mui/icons-material/Stars';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';

function pad(n) { return String(n).padStart(2, '0'); }

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Dobro jutro';
  if (h < 18) return 'Dobar dan';
  return 'Dobra večer';
}

export default function HomeScreen({ onNavigate }) {
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [animatedXp, setAnimatedXp] = useState(0);
  const [countdown, setCountdown] = useState('');
  const [dailyQuote, setDailyQuote] = useState(null);

  const totalXp = profile?.xp || 0;
  const level = Math.floor(totalXp / 500) + 1;
  const xpIntoLevel = totalXp % 500;
  const xpForNext = 500;
  const multiplier = profile?.xp_multiplier || 1.0;

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

  // Fetch daily quote
  useEffect(() => {
    const fetchQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      // Try scheduled quote first
      let { data } = await supabase
        .from('daily_quotes')
        .select('*')
        .eq('scheduled_date', today)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!data) {
        // Fallback: rotate by day of year
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const { data: quotes } = await supabase
          .from('daily_quotes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (quotes && quotes.length > 0) {
          data = quotes[dayOfYear % quotes.length];
        }
      }
      if (data) setDailyQuote(data);
    };
    fetchQuote();
  }, []);

  const stats = [
    { icon: <LocalFireDepartmentIcon />, value: profile?.streak || 0, label: 'Streak', bg: '#fff0eb', color: '#f07147' },
    { icon: <StarsIcon />, value: level, label: 'Rang', bg: '#dbeafe', color: '#3b82f6' },
    { icon: <BoltIcon />, value: animatedXp, label: 'Akcije', bg: '#ccfbf1', color: '#0d9488' },
    { icon: <AutoAwesomeIcon />, value: `${multiplier}x`, label: 'Multiplier', bg: '#ffedd5', color: '#f07147' },
  ];

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-card-bg" />
        <div className="hero-greeting">{getGreeting()}, {profile?.name?.split(' ')[0] || 'Priša'} 👋</div>
        <div className="hero-welcome">Tvoj dan čeka!</div>

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
          {multiplier > 1 && (
            <div className="multiplier-chip">
              🔥 {multiplier}x Multiplier
            </div>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-tile">
            <div className="stat-tile-icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="stat-tile-value">{s.value}</div>
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
          <div className="cta-card-title">Dnevni izazovi</div>
          <div className="cta-card-text">Osvoji XP bodove danas!</div>
        </div>
        <ArrowForwardIcon className="cta-card-arrow" />
      </div>

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

      {/* Daily quote */}
      {dailyQuote && (
        <div className="daily-quote">
          <div className="daily-quote-text">"{dailyQuote.text}"</div>
          {dailyQuote.author && (
            <div className="daily-quote-label">— {dailyQuote.author}</div>
          )}
          {!dailyQuote.author && (
            <div className="daily-quote-label">💡 Citat dana</div>
          )}
        </div>
      )}
    </div>
  );
}
