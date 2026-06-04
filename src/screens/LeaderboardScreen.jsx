import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_CLASSES = ['gold', 'silver', 'bronze'];

export default function LeaderboardScreen() {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [lbRes, teamsRes] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_url, xp, level, streak, team_id, teams(name, color, icon)').eq('is_banned', false).eq('hide_from_leaderboard', false).order('xp', { ascending: false }).limit(50),
        supabase.from('teams').select('*'),
      ]);
      
      let aggregatedTeams = [];
      if (lbRes.data) setLeaderboard(lbRes.data);
      
      if (teamsRes.data) {
        // Fetch all active profiles' xp to calculate aggregate team scores
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('team_id, xp')
          .eq('is_banned', false)
          .eq('hide_from_leaderboard', false);
        
        const teamScores = {};
        const teamMemberCounts = {};
        
        if (allProfiles) {
          allProfiles.forEach(p => {
            if (p.team_id) {
              teamScores[p.team_id] = (teamScores[p.team_id] || 0) + (p.xp || 0);
              teamMemberCounts[p.team_id] = (teamMemberCounts[p.team_id] || 0) + 1;
            }
          });
        }
        
        aggregatedTeams = teamsRes.data.map(team => ({
          ...team,
          score: teamScores[team.id] || 0,
          member_count: teamMemberCounts[team.id] || 0
        })).sort((a, b) => b.score - a.score);
        
        setTeams(aggregatedTeams);
      }
    };
    fetchData();

    // Realtime subscription - using a unique random suffix to avoid channel reuse conflicts
    const randomSuffix = Math.random().toString(36).slice(2, 11);
    const channelId = `leaderboard-changes-${randomSuffix}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const top3 = leaderboard.slice(0, 3);
  // Reorder for podium: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;
  const podiumClasses = top3.length >= 3
    ? ['silver', 'gold', 'bronze']
    : PODIUM_CLASSES.slice(0, top3.length);
  const podiumMedals = top3.length >= 3
    ? ['🥈', '🥇', '🥉']
    : MEDALS.slice(0, top3.length);

  return (
    <div className="fade-in-content">
      {/* Podium */}
      {top3.length > 0 && (
        <div className="podium-section">
          {podiumOrder.map((user, i) => {
            const avatarLetter = user.name?.charAt(0)?.toUpperCase() || '?';
            return (
              <div key={user.id} className={`podium-slot hover-scale ${podiumClasses[i]}`}>
                <div className="podium-medal">{podiumMedals[i]}</div>
                <div className="podium-avatar">
                  {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : avatarLetter}
                </div>
                <div className="podium-name">{user.name?.split(' ')[0]}</div>
                <div className="podium-xp">{user.xp} XP</div>
                <div className={`podium-bar`} />
              </div>
            );
          })}
        </div>
      )}

      {/* Rank list — includes everyone (also top 3) */}
      <div className="rank-list">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: '24px 0 16px 0', color: 'var(--text-dark)' }}>
          👥 Ukupni poredak
        </h3>
        {leaderboard.map((user, i) => {
          const rank = i + 1;
          const isMe = user.id === profile?.id;
          const avatarLetter = user.name?.charAt(0)?.toUpperCase() || '?';
          return (
            <div key={user.id} className={`rank-card hover-scale ${isMe ? 'me' : ''}`}>
              <div className="rank-number" style={rank <= 3 ? { color: 'var(--prisa-orange)', fontWeight: 900 } : {}}>
                {rank <= 3 ? MEDALS[rank - 1] : `${rank}.`}
              </div>
              <div className="rank-avatar">
                {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : avatarLetter}
              </div>
              <div className="rank-info">
                <div className="rank-name">{user.name}{isMe && ' (ti)'}</div>
                <div className="rank-team">{user.teams?.name || 'Bez tima'}</div>
              </div>
              <div className="rank-points">{user.xp} XP</div>
            </div>
          );
        })}
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <>
          <div className="teams-section-title" style={{ marginTop: '32px' }}>🏆 Timovi</div>
          <div className="teams-grid">
            {teams.map(team => (
              <div key={team.id} className="team-card hover-scale">
                <div className="team-card-icon">{team.icon || '🏳️'}</div>
                <div className="team-card-name">{team.name}</div>
                <div className="team-card-members">{team.member_count || 0} članova</div>
                <div className="team-card-score" style={{ color: team.color || 'var(--prisa-orange)' }}>
                  {team.score || 0} bodova
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
