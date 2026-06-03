import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BoltIcon from '@mui/icons-material/Bolt';

// Demo data
const ME_FIGHTER = { name: 'Ti', emoji: '🥋', level: 5, elo: 1247, winRate: '67%', xp: 0 };
const OPP_FIGHTER = { name: 'Protivnik', emoji: '🧑‍🎤', level: 4, elo: 1189, winRate: '52%', xp: 0 };

const DEMO_MOVES = [
  { isMe: true, category: 'Fitness', xp: 15, desc: 'Napravio 50 sklekova', time: '14:32' },
  { isMe: false, category: 'Čitanje', xp: 10, desc: 'Pročitao 30 stranica', time: '13:45' },
  { isMe: true, category: 'Prehrana', xp: 20, desc: 'Skuhao zdravi obrok', time: '12:10' },
  { isMe: false, category: 'Mindfulness', xp: 12, desc: 'Meditacija 15 min', time: '11:30' },
  { isMe: true, category: 'Zdravlje', xp: 10, desc: 'Popio 2L vode', time: '10:05' },
];

function pad(n) { return String(n).padStart(2, '0'); }

export default function ArenaScreen() {
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [myAnimXp, setMyAnimXp] = useState(0);
  const [oppAnimXp, setOppAnimXp] = useState(0);
  const [countdown, setCountdown] = useState('');

  const myXp = DEMO_MOVES.filter(m => m.isMe).reduce((sum, m) => sum + m.xp, 0);
  const oppXp = DEMO_MOVES.filter(m => !m.isMe).reduce((sum, m) => sum + m.xp, 0);
  const totalXp = myXp + oppXp;
  const myShare = totalXp > 0 ? (myXp / totalXp) * 100 : 50;
  const imWinning = myXp >= oppXp;

  // ELO calc
  const K = 32;
  const expectedMe = 1 / (1 + Math.pow(10, (OPP_FIGHTER.elo - ME_FIGHTER.elo) / 400));
  const eloWin = Math.round(K * (1 - expectedMe));
  const eloLoss = Math.round(K * (0 - expectedMe));

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const steps = 40;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const p = step / steps;
      const e = 1 - Math.pow(1 - p, 3);
      setMyAnimXp(Math.round(myXp * e));
      setOppAnimXp(Math.round(oppXp * e));
      if (step >= steps) clearInterval(iv);
    }, 30);
    return () => clearInterval(iv);
  }, [mounted, myXp, oppXp]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 0);
      const diff = Math.max(0, end - now);
      setCountdown(`${pad(Math.floor(diff / 3600000))}:${pad(Math.floor((diff % 3600000) / 60000))}:${pad(Math.floor((diff % 60000) / 1000))}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {/* Demo banner */}
      <div className="arena-demo-banner">
        <div className="arena-demo-banner-text">⚔️ Demo prikaz — PvP dolazi uskoro!</div>
      </div>

      {/* Fighter cards + VS */}
      <div className="arena-vs-section">
        {/* Me */}
        <div className={`fighter-card left ${mounted ? 'mounted' : ''} ${imWinning ? 'winning' : ''}`}>
          {imWinning && <div className="fighter-crown">👑</div>}
          <div className="fighter-avatar">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : '🥋'}
          </div>
          <div className="fighter-name">{profile?.name?.split(' ')[0] || 'Ti'}</div>
          <div className="fighter-level">LVL {Math.floor((profile?.xp || 0) / 500) + 1}</div>
          <div className="fighter-xp">{myAnimXp} XP</div>
          <div className="elo-badge">
            ⚡ {ME_FIGHTER.elo}
          </div>
          <div className="fighter-winrate">Win: {ME_FIGHTER.winRate}</div>
        </div>

        {/* VS */}
        <div className={`vs-seal ${mounted ? 'mounted' : ''}`}>VS</div>

        {/* Opponent */}
        <div className={`fighter-card right ${mounted ? 'mounted' : ''} ${!imWinning ? 'winning' : ''}`}>
          {!imWinning && <div className="fighter-crown">👑</div>}
          <div className="fighter-avatar">{OPP_FIGHTER.emoji}</div>
          <div className="fighter-name">{OPP_FIGHTER.name}</div>
          <div className="fighter-level">LVL {OPP_FIGHTER.level}</div>
          <div className="fighter-xp">{oppAnimXp} XP</div>
          <div className="elo-badge">
            ⚡ {OPP_FIGHTER.elo}
          </div>
          <div className="fighter-winrate">Win: {OPP_FIGHTER.winRate}</div>
        </div>
      </div>

      {/* Battle bar */}
      <div className="battle-bar-wrap">
        <div className="battle-bar">
          <div className="battle-bar-me" style={{ width: `${myShare}%` }} />
        </div>
        <div className="battle-bar-labels">
          <span>{Math.round(myShare)}%</span>
          <span>Preostalo: {countdown}</span>
          <span>{Math.round(100 - myShare)}%</span>
        </div>
      </div>

      {/* ELO Stakes */}
      <div className="elo-stakes">
        <div className="elo-stake-box">
          <div className="elo-stake-label">Pobjeda</div>
          <div className="elo-stake-value win">+{eloWin} ELO</div>
        </div>
        <div className="elo-stake-box">
          <div className="elo-stake-label">Poraz</div>
          <div className="elo-stake-value loss">{eloLoss} ELO</div>
        </div>
      </div>

      {/* CTA */}
      <button className="btn btn-primary btn-block btn-large" disabled>
        ⚔️ Arena uskoro...
      </button>

      {/* Moves feed */}
      <div className="arena-moves">
        <div className="arena-moves-title">📋 Posljednji potezi</div>
        {[...DEMO_MOVES].reverse().map((move, i) => (
          <div key={i} className="arena-move">
            <div
              className="arena-move-avatar"
              style={{
                background: move.isMe ? 'var(--prisa-orange-light)' : 'var(--prisa-blue-light)',
                color: move.isMe ? 'var(--prisa-orange)' : 'var(--prisa-blue)',
              }}
            >
              {move.isMe ? '🥋' : '🧑‍🎤'}
            </div>
            <div className="arena-move-content">
              <div className="arena-move-name">{move.isMe ? (profile?.name?.split(' ')[0] || 'Ti') : 'Protivnik'}</div>
              <div className="arena-move-desc">{move.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="arena-move-xp">+{move.xp}</div>
              <div className="arena-move-time">{move.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
