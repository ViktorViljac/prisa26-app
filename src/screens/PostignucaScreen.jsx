import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';
import LockIcon from '@mui/icons-material/Lock';
import StarsIcon from '@mui/icons-material/Stars';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `Kreće: ${day}.${month}.`;
}

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

  // Filter out hidden achievements unless the user has unlocked them
  const visibleAchievements = achievements.filter(ach => isUnlocked(ach.id) || ach.visibility !== 'hidden');
  
  const unlockedList = visibleAchievements.filter(ach => isUnlocked(ach.id));
  const lockedList = visibleAchievements.filter(ach => !isUnlocked(ach.id));

  return (
    <div>
      {/* Header */}
      <div className="achievements-header">
        <div className="achievements-count">
          <span>{unlockedCount}</span> / {visibleAchievements.length} izazova
        </div>
      </div>

      {/* Unlock code */}
      <div className="unlock-code-section">
        <div className="unlock-code-title">🔑 Unesi kod</div>
        <div className="unlock-code-row">
          <input
            type="text"
            value={unlockCode}
            onChange={e => setUnlockCode(e.target.value)}
            placeholder="UNESI KOD"
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
          {lockedList.map(ach => {
            const isMystery = ach.visibility === 'mystery';
            const isComingSoon = ach.visibility === 'coming_soon';

            return (
              <div 
                key={ach.id} 
                className={`achievement-card locked ${isComingSoon ? 'coming-soon' : ''}`}
                style={{ 
                  filter: 'grayscale(1)', 
                  opacity: 0.65,
                  position: 'relative',
                  border: isComingSoon ? '1.5px dashed var(--prisa-orange)' : undefined,
                  background: isComingSoon ? '#fffbeb' : undefined
                }}
              >
                <div className="achievement-icon">{isMystery ? '❓' : (ach.icon || '🏅')}</div>
                <div className="achievement-title">{isMystery ? '???' : ach.title}</div>
                <div className="achievement-desc">
                  {isMystery 
                    ? 'Ovaj izazov je tajna dok ga ne otključaš!' 
                    : ach.description}
                </div>

                {isComingSoon && ach.start_date && (
                  <div style={{ 
                    marginTop: 8, 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    color: '#d97706',
                    background: '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    ⏳ {formatDate(ach.start_date)}
                  </div>
                )}

                {!isComingSoon && ach.xp_reward > 0 && (
                  <div className="challenge-xp-badge" style={{ marginTop: 8 }}>
                    ⚡ {isMystery ? '?' : ach.xp_reward} XP
                  </div>
                )}

                <div className="achievement-lock-overlay">
                  {isComingSoon ? (
                    <span style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 800, 
                      color: '#d97706',
                      background: '#fff',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid #f59e0b',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      Uskoro
                    </span>
                  ) : (
                    <LockIcon className="achievement-lock-icon" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
