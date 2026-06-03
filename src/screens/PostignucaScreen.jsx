import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';
import LockIcon from '@mui/icons-material/Lock';

export default function PostignucaScreen() {
  const { profile, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [unlockCode, setUnlockCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [achRes, uaRes] = await Promise.all([
        supabase.from('achievements').select('*').order('sort_order'),
        profile ? supabase.from('user_achievements').select('*').eq('user_id', profile.id) : { data: [] },
      ]);
      if (achRes.data) setAchievements(achRes.data);
      if (uaRes.data) setUserAchievements(uaRes.data);
    };
    fetchData();
  }, [profile]);

  const isUnlocked = (achId) => userAchievements.some(ua => ua.achievement_id === achId);
  const unlockedCount = userAchievements.length;

  const handleRedeemCode = async () => {
    if (!unlockCode.trim() || !profile) return;
    setCodeError('');
    setCodeSuccess('');
    setSubmitting(true);

    try {
      // Find achievement with this code
      const { data: ach } = await supabase
        .from('achievements')
        .select('*')
        .eq('unlock_code', unlockCode.trim().toUpperCase())
        .single();

      if (!ach) {
        setCodeError('Nepoznat kod. Pokušaj ponovo.');
        setSubmitting(false);
        return;
      }

      // Check if already unlocked
      if (isUnlocked(ach.id)) {
        setCodeError('Već imaš ovo postignuće!');
        setSubmitting(false);
        return;
      }

      // Unlock it
      const { error } = await supabase.from('user_achievements').insert({
        user_id: profile.id,
        achievement_id: ach.id,
        unlocked_at: new Date().toISOString(),
      });

      if (!error) {
        // Award bonus XP
        if (ach.xp_reward > 0) {
          await supabase.rpc('award_xp', {
            p_user_id: profile.id,
            p_xp_amount: ach.xp_reward,
          });
        }

        posthog.capture('achievement_unlocked', {
          achievement_id: ach.id,
          achievement_title: ach.title,
          method: 'code',
          xp_reward: ach.xp_reward,
        });

        setCodeSuccess(`🎉 Otključano: ${ach.title} (+${ach.xp_reward} XP)`);
        setUnlockCode('');
        await refreshProfile();

        // Refresh user achievements
        const { data } = await supabase.from('user_achievements').select('*').eq('user_id', profile.id);
        if (data) setUserAchievements(data);
      }
    } catch (err) {
      setCodeError('Došlo je do greške.');
    }
    setSubmitting(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="achievements-header">
        <div className="achievements-count">
          <span>{unlockedCount}</span> / {achievements.length} postignuća
        </div>
      </div>

      {/* Unlock code */}
      <div className="unlock-code-section">
        <div className="unlock-code-title">🔑 Imaš kod?</div>
        <div className="unlock-code-row">
          <input
            type="text"
            value={unlockCode}
            onChange={e => setUnlockCode(e.target.value)}
            placeholder="UNESI KOD"
            maxLength={20}
          />
          <button
            className="btn btn-primary"
            onClick={handleRedeemCode}
            disabled={submitting || !unlockCode.trim()}
          >
            {submitting ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Aktiviraj'}
          </button>
        </div>
        {codeError && <div className="input-error" style={{ marginTop: 8 }}>{codeError}</div>}
        {codeSuccess && <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)' }}>{codeSuccess}</div>}
      </div>

      {/* XP progress card */}
      <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--prisa-orange)' }}>
          {profile?.xp || 0} XP
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-gray)' }}>
          Razina {Math.floor((profile?.xp || 0) / 500) + 1}
        </div>
      </div>

      {/* Achievement grid */}
      <div className="achievements-grid">
        {achievements.map(ach => {
          const unlocked = isUnlocked(ach.id);
          return (
            <div key={ach.id} className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="achievement-icon">{ach.icon || '🏅'}</div>
              <div className="achievement-title">{ach.title}</div>
              <div className="achievement-desc">{ach.description}</div>
              {ach.xp_reward > 0 && (
                <div className="challenge-xp-badge" style={{ marginTop: 8 }}>
                  ⚡ {ach.xp_reward} XP
                </div>
              )}
              {!unlocked && (
                <div className="achievement-lock-overlay">
                  <LockIcon className="achievement-lock-icon" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
