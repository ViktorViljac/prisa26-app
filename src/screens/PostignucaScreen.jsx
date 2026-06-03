import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';
import LockIcon from '@mui/icons-material/Lock';
import StarsIcon from '@mui/icons-material/Stars';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PostignucaScreen() {
  const { profile, refreshProfile } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [unlockCode, setUnlockCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    const [achRes, uaRes] = await Promise.all([
      supabase.from('achievements').select('*').order('sort_order'),
      profile ? supabase.from('user_achievements').select('*').eq('user_id', profile.id) : { data: [] },
    ]);
    if (achRes.data) setAchievements(achRes.data);
    if (uaRes.data) setUserAchievements(uaRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const isUnlocked = (achId) => userAchievements.some(ua => ua.achievement_id === achId);
  const unlockedCount = userAchievements.length;

  const handleRedeemCode = async () => {
    const cleanCode = unlockCode.trim().toUpperCase();
    if (!cleanCode || !profile) return;
    setCodeError('');
    setCodeSuccess('');
    setSubmitting(true);

    try {
      // 1. Try single-use codes first
      const { data: codeRow, error: codeErr } = await supabase
        .from('achievement_codes')
        .select('*, achievements(*)')
        .eq('code', cleanCode)
        .eq('is_used', false)
        .single();

      if (!codeErr && codeRow && codeRow.achievements) {
        const ach = codeRow.achievements;
        
        // Check if already unlocked
        if (isUnlocked(ach.id)) {
          setCodeError('Već imaš ovo postignuće!');
          setSubmitting(false);
          return;
        }

        // Mark code as used
        const { error: updateErr } = await supabase
          .from('achievement_codes')
          .update({
            is_used: true,
            used_by: profile.id,
            used_at: new Date().toISOString(),
          })
          .eq('id', codeRow.id);

        if (updateErr) throw updateErr;

        // Unlock achievement
        await supabase.from('user_achievements').insert({
          user_id: profile.id,
          achievement_id: ach.id,
        });

        // Award XP
        if (ach.xp_reward > 0) {
          await supabase.rpc('award_xp', {
            p_user_id: profile.id,
            p_xp_amount: ach.xp_reward,
          });
        }

        posthog.capture('achievement_unlocked', {
          achievement_id: ach.id,
          achievement_title: ach.title,
          method: 'single_use_code',
          xp_reward: ach.xp_reward,
        });

        setCodeSuccess(`🎉 Otključano: ${ach.title} (+${ach.xp_reward} XP)`);
        setUnlockCode('');
        await refreshProfile();
        await fetchData();
        setSubmitting(false);
        return;
      }

      // 2. Fallback: Try static achievements codes
      const { data: ach } = await supabase
        .from('achievements')
        .select('*')
        .eq('unlock_code', cleanCode)
        .single();

      if (!ach) {
        setCodeError('Nepoznat ili već iskorišten kod. Pokušaj ponovo.');
        setSubmitting(false);
        return;
      }

      if (isUnlocked(ach.id)) {
        setCodeError('Već imaš ovo postignuće!');
        setSubmitting(false);
        return;
      }

      // Unlock it
      const { error } = await supabase.from('user_achievements').insert({
        user_id: profile.id,
        achievement_id: ach.id,
      });

      if (!error) {
        if (ach.xp_reward > 0) {
          await supabase.rpc('award_xp', {
            p_user_id: profile.id,
            p_xp_amount: ach.xp_reward,
          });
        }

        posthog.capture('achievement_unlocked', {
          achievement_id: ach.id,
          achievement_title: ach.title,
          method: 'static_code',
          xp_reward: ach.xp_reward,
        });

        setCodeSuccess(`🎉 Otključano: ${ach.title} (+${ach.xp_reward} XP)`);
        setUnlockCode('');
        await refreshProfile();
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setCodeError('Došlo je do greške prilikom aktivacije.');
    } finally {
      setSubmitting(false);
    }
  };

  const unlockedList = achievements.filter(ach => isUnlocked(ach.id));
  const lockedList = achievements.filter(ach => !isUnlocked(ach.id));

  return (
    <div>
      {/* Header */}
      <div className="achievements-header">
        <div className="achievements-count">
          <span>{unlockedCount}</span> / {achievements.length} izazova
        </div>
      </div>

      {/* Unlock code */}
      <div className="unlock-code-section">
        <div className="unlock-code-title">🔑 Aktiviraj kod izazova</div>
        <div className="unlock-code-row">
          <input
            type="text"
            value={unlockCode}
            onChange={e => setUnlockCode(e.target.value)}
            placeholder="UNESI JEDNOKRATNI ILI GLOBALNI KOD"
            maxLength={30}
            style={{ textTransform: 'uppercase' }}
          />
          <button
            className="btn btn-primary"
            onClick={handleRedeemCode}
            disabled={submitting || !unlockCode.trim()}
          >
            {submitting ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Aktiviraj'}
          </button>
        </div>
        {codeError && <div className="input-error" style={{ marginTop: 8, color: '#ef4444', fontWeight: 'bold' }}>{codeError}</div>}
        {codeSuccess && <div style={{ marginTop: 8, fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)' }}>{codeSuccess}</div>}
      </div>

      {/* Unlocked Section */}
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <CheckCircleIcon style={{ color: 'var(--prisa-teal)' }} />
        Otključani izazovi ({unlockedList.length})
      </h2>
      
      {unlockedList.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-muted)',
          marginBottom: 32
        }}>
          Još nisi otključao nijedan izazov. Kreni rješavati navike ili aktiviraj kodove! 🚀
        </div>
      ) : (
        <div className="achievements-grid" style={{ marginBottom: 32 }}>
          {unlockedList.map(ach => (
            <div key={ach.id} className="achievement-card unlocked">
              <div className="achievement-icon">{ach.icon || '🏅'}</div>
              <div className="achievement-title">{ach.title}</div>
              <div className="achievement-desc">{ach.description}</div>
              {ach.xp_reward > 0 && (
                <div className="challenge-xp-badge" style={{ marginTop: 8 }}>
                  ⚡ {ach.xp_reward} XP
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Locked Section */}
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <LockIcon style={{ color: 'var(--text-muted)' }} />
        Zaključani izazovi ({lockedList.length})
      </h2>

      {lockedList.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          textAlign: 'center',
          color: 'var(--prisa-teal)',
          fontWeight: 'bold',
          marginBottom: 32
        }}>
          Čestitamo! Otključao si sve dostupne izazove! 🎉
        </div>
      ) : (
        <div className="achievements-grid">
          {lockedList.map(ach => (
            <div key={ach.id} className="achievement-card locked" style={{ filter: 'grayscale(1)', opacity: 0.55 }}>
              <div className="achievement-icon">{ach.icon || '🏅'}</div>
              <div className="achievement-title">{ach.title}</div>
              <div className="achievement-desc">{ach.description}</div>
              {ach.xp_reward > 0 && (
                <div className="challenge-xp-badge" style={{ marginTop: 8 }}>
                  ⚡ {ach.xp_reward} XP
                </div>
              )}
              <div className="achievement-lock-overlay">
                <LockIcon className="achievement-lock-icon" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
