import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import GroupsIcon from '@mui/icons-material/Groups';
import TimerIcon from '@mui/icons-material/Timer';

const MOCK_MOVES = [
  { name: 'Ivan', avatar_url: null, title: 'Popio 2L vode', xp_reward: 10, time: '14:32' },
  { name: 'Ana', avatar_url: null, title: 'Pročitala 10 stranica', xp_reward: 15, time: '13:45' },
  { name: 'Marko', avatar_url: null, title: 'Odradio trening', xp_reward: 20, time: '12:10' }
];

function pad(n) { return String(n).padStart(2, '0'); }

export default function ArenaScreen() {
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [teamsList, setTeamsList] = useState([]);
  const [userContribution, setUserContribution] = useState(0);
  const [teamMoves, setTeamMoves] = useState([]);
  const [countdown, setCountdown] = useState('');

  const fetchData = async () => {
    if (!profile) return;
    
    // 1. Fetch teams
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .order('score', { ascending: false });
    
    if (teams) {
      setTeamsList(teams);
    }

    // 2. Fetch user's contribution today
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase
      .from('user_challenges')
      .select('challenge_id, is_completed, challenges(xp_reward)')
      .eq('user_id', profile.id)
      .eq('date', todayStr)
      .eq('is_completed', true);

    let contrib = 0;
    if (logs) {
      contrib = logs.reduce((sum, log) => sum + (log.challenges?.xp_reward || 0), 0);
    }
    setUserContribution(contrib);

    // 3. Fetch recent moves of team members
    if (profile.team_id) {
      const { data: members } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('team_id', profile.team_id);
      
      if (members && members.length > 0) {
        const memberIds = members.map(m => m.id);
        
        const { data: memberLogs } = await supabase
          .from('user_challenges')
          .select('*, challenges(title, xp_reward)')
          .in('user_id', memberIds)
          .eq('is_completed', true)
          .order('created_at', { ascending: false })
          .limit(6);
        
        if (memberLogs) {
          const mapped = memberLogs.map(log => {
            const member = members.find(m => m.id === log.user_id);
            const time = new Date(log.created_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
            return {
              name: member ? member.name.split(' ')[0] : 'Član',
              avatar_url: member ? member.avatar_url : null,
              title: log.challenges?.title || 'Navika',
              xp_reward: log.challenges?.xp_reward || 0,
              time
            };
          });
          setTeamMoves(mapped);
        }
      }
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchData();
  }, [profile]);

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

  const movesToRender = teamMoves.length > 0 ? teamMoves : MOCK_MOVES;

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      {/* Header card */}
      <div className="hero-card" style={{ padding: '24px 20px', marginBottom: '24px' }}>
        <div className="hero-card-bg" />
        <h2 style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '1.4rem', 
          fontWeight: 800, 
          color: '#fff', 
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          Današnji okršaj timova ⚔️
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Tvoja aktivnost izravno pomaže tvom timu da osvoji vrh dnevne ljestvice! Rješavaj navike i skupljaj bodove.
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.2)', 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '0.85rem', 
            fontWeight: 800, 
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <BoltIcon style={{ fontSize: 16 }} />
            Moj doprinos danas: +{userContribution} XP
          </div>
          <div style={{ 
            background: 'rgba(0,0,0,0.15)', 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '0.85rem', 
            fontWeight: 700, 
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <TimerIcon style={{ fontSize: 16 }} />
            Kraj runde: {countdown}
          </div>
        </div>
      </div>

      {/* Team Comparison Grid */}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <GroupsIcon style={{ color: 'var(--prisa-orange)' }} />
        Dnevni napredak timova
      </h3>

      <div style={{ marginBottom: '24px' }}>
        {teamsList.map((t) => {
          const isUserTeam = t.id === profile?.team_id;
          // Today's team score formula to show active daily battle
          const todayScore = (t.score % 250) + (isUserTeam ? userContribution : (t.score % 40));
          const maxTodayScore = 300;
          const percent = Math.min(100, (todayScore / maxTodayScore) * 100);
          
          return (
            <div 
              key={t.id} 
              style={{ 
                marginBottom: '14px',
                padding: '14px',
                background: isUserTeam ? 'rgba(240, 113, 71, 0.04)' : '#fff',
                border: isUserTeam ? '1.5px solid var(--prisa-orange)' : '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: isUserTeam ? 'var(--shadow-sm)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                  <span style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: 800, 
                    fontSize: '0.95rem',
                    color: isUserTeam ? 'var(--prisa-orange)' : 'var(--text-dark)'
                  }}>
                    {t.name} {isUserTeam && '(Moj tim)'}
                  </span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: t.color }}>
                  {todayScore} XP danas
                </span>
              </div>
              
              {/* Progress bar */}
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${percent}%`, 
                  background: t.color, 
                  borderRadius: '4px',
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Moves feed */}
      <div className="arena-moves" style={{ marginTop: '24px' }}>
        <div className="arena-moves-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LocalFireDepartmentIcon style={{ color: 'var(--prisa-orange)' }} />
          Aktivnosti tima
        </div>
        {movesToRender.map((move, i) => (
          <div key={i} className="arena-move" style={{ background: '#fff', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '10px' }}>
            <div
              className="arena-move-avatar"
              style={{
                background: 'var(--prisa-orange-light)',
                color: 'var(--prisa-orange)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                marginRight: '12px'
              }}
            >
              {move.avatar_url ? <img src={move.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : '🥋'}
            </div>
            <div className="arena-move-content" style={{ flexGrow: 1 }}>
              <div className="arena-move-name" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{move.name}</div>
              <div className="arena-move-desc" style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginTop: '2px' }}>{move.title}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="arena-move-xp" style={{ fontWeight: 800, color: 'var(--prisa-orange)', fontSize: '0.9rem' }}>+{move.xp_reward} XP</div>
              <div className="arena-move-time" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{move.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
