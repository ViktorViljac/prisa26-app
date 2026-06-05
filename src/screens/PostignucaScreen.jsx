import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';
import LockIcon from '@mui/icons-material/Lock';
import StarsIcon from '@mui/icons-material/Stars';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
  const [selectedAchievement, setSelectedAchievement] = useState(null);

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
        
        // Prevent unlocking coming_soon or hidden achievements
        if (ach.visibility === 'coming_soon') {
          setCodeError('Ovaj izazov još nije dostupan (uskoro dolazi)!');
          setSubmitting(false);
          return;
        }
        if (ach.visibility === 'hidden') {
          setCodeError('Nepoznat ili nevažeći kod.');
          setSubmitting(false);
          return;
        }

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

      // Prevent unlocking coming_soon or hidden achievements
      if (ach.visibility === 'coming_soon') {
        setCodeError('Ovaj izazov još nije dostupan (uskoro dolazi)!');
        setSubmitting(false);
        return;
      }
      if (ach.visibility === 'hidden') {
        setCodeError('Nepoznat ili nevažeći kod.');
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

  const visibleAchievements = achievements.filter(ach => isUnlocked(ach.id) || ach.visibility !== 'hidden');
  const unlockedList = visibleAchievements.filter(ach => isUnlocked(ach.id));
  const lockedList = visibleAchievements.filter(ach => !isUnlocked(ach.id));

  return (
    <div className="fade-in-content">
      {/* Header */}
      <div className="achievements-header" style={{ marginBottom: 16 }}>
        <div className="achievements-count">
          <span>{unlockedCount}</span> / {visibleAchievements.length} izazova
        </div>
      </div>

      {/* Unlock code - compact UI */}
      <div className="unlock-code-section" style={{ padding: '16px', marginBottom: '24px' }}>
        <div className="unlock-code-title" style={{ fontSize: '0.95rem', marginBottom: '8px' }}>🔑 Unesi kod</div>
        <div className="unlock-code-row" style={{ gap: '8px' }}>
          <input
            type="text"
            value={unlockCode}
            onChange={e => setUnlockCode(e.target.value)}
            placeholder="UNESI KOD"
            maxLength={30}
            style={{ textTransform: 'uppercase', padding: '10px 14px', fontSize: '0.95rem', flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleRedeemCode}
            disabled={submitting || !unlockCode.trim()}
            style={{ padding: '10px 20px', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
          >
            {submitting ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : 'Aktiviraj'}
          </button>
        </div>
        {codeError && <div className="input-error" style={{ marginTop: 6, color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem' }}>{codeError}</div>}
        {codeSuccess && <div style={{ marginTop: 6, fontSize: '0.85rem', fontWeight: 700, color: 'var(--prisa-teal)' }}>{codeSuccess}</div>}
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
        <div className="achievements-compact-grid" style={{ marginBottom: 32 }}>
          {unlockedList.map(ach => (
            <div 
              key={ach.id} 
              className="achievement-card unlocked hover-scale"
              onClick={() => setSelectedAchievement({ ...ach, isUnlocked: true })}
              style={{ 
                cursor: 'pointer', 
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '160px',
                position: 'relative',
                background: '#ffffff',
                border: '1.5px solid var(--prisa-teal)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.05)'
              }}
            >
              {/* Checkmark in top right */}
              <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--prisa-teal)', display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon style={{ fontSize: '16px' }} />
              </div>

              <div className="achievement-icon" style={{ fontSize: '2.2rem', margin: '0 0 8px 0' }}>{ach.icon || '🏅'}</div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div className="achievement-title" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px', textAlign: 'center' }}>
                  {ach.title}
                </div>
                <div className="achievement-desc-preview" style={{ fontSize: '0.78rem', color: 'var(--text-gray)', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textAlign: 'center', lineHeight: 1.4, width: '100%' }}>
                  {ach.description}
                </div>
              </div>

              {ach.xp_reward > 0 && (
                <div style={{ 
                  marginTop: '10px',
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  color: 'var(--prisa-teal)',
                  background: 'var(--prisa-teal-pastel)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                }}>
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
        <div className="achievements-compact-grid">
          {lockedList.map(ach => {
            const isMystery = ach.visibility === 'mystery';
            const isComingSoon = ach.visibility === 'coming_soon';

            return (
              <div 
                key={ach.id} 
                className={`achievement-card locked hover-scale ${isComingSoon ? 'coming-soon' : ''}`}
                onClick={() => setSelectedAchievement({ ...ach, isUnlocked: false, isMystery, isComingSoon })}
                style={{ 
                  cursor: 'pointer', 
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '160px',
                  position: 'relative',
                  background: isComingSoon ? '#fffbeb' : '#f8fafc',
                  border: isComingSoon ? '1.5px dashed #d97706' : '1.5px solid #e2e8f0',
                  borderRadius: 'var(--radius-md)',
                  opacity: 0.8,
                  filter: 'grayscale(0.3)'
                }}
              >
                {/* Lock or Status Badge in top right */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--text-muted)' }}>
                  {isComingSoon ? (
                    <span style={{ 
                      fontSize: '0.62rem', 
                      fontWeight: 800, 
                      color: '#d97706',
                      background: '#fef3c7',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      USKORO
                    </span>
                  ) : (
                    <LockIcon style={{ fontSize: '14px', color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div className="achievement-icon" style={{ fontSize: '2.2rem', margin: '0 0 8px 0', opacity: 0.6 }}>
                  {isMystery ? '❓' : (ach.icon || '🏅')}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div className="achievement-title" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px', textAlign: 'center', opacity: 0.8 }}>
                    {isMystery ? 'Tajna' : ach.title}
                  </div>
                  <div className="achievement-desc-preview" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textAlign: 'center', lineHeight: 1.4, width: '100%' }}>
                    {isMystery 
                      ? 'Ovaj izazov je tajna dok ga ne otključaš!' 
                      : isComingSoon 
                        ? 'Ovaj izazov stiže uskoro. Budi spreman!' 
                        : ach.description}
                  </div>
                </div>

                {ach.xp_reward > 0 && (
                  <div style={{ 
                    marginTop: '10px',
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: isComingSoon ? '#d97706' : 'var(--text-muted)',
                    background: isComingSoon ? '#fef3c7' : '#e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '10px',
                  }}>
                    ⚡ {isMystery ? '?' : ach.xp_reward} XP
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Redesigned Premium Detail Modal */}
      {selectedAchievement && (
        <div className="achievement-dialog-overlay" onClick={() => setSelectedAchievement(null)}>
          <div className="achievement-dialog-card" onClick={e => e.stopPropagation()}>
            {/* Gradient Header based on state */}
            <div className={`achievement-dialog-header ${
              selectedAchievement.isUnlocked ? 'unlocked' :
              selectedAchievement.isComingSoon ? 'coming_soon' :
              selectedAchievement.isMystery ? 'mystery' : 'locked'
            }`}>
              <button 
                className="achievement-dialog-close-btn"
                onClick={() => setSelectedAchievement(null)}
              >
                ×
              </button>

              {/* Floating circular icon wrap */}
              <div className="achievement-dialog-icon-wrap">
                {selectedAchievement.isMystery ? '❓' : (selectedAchievement.icon || '🏅')}
              </div>
            </div>
            
            <div className="achievement-dialog-body">
              <h2 className="achievement-dialog-title">
                {selectedAchievement.isMystery ? 'Tajna' : selectedAchievement.title}
              </h2>
              
              <p className="achievement-dialog-desc">
                {selectedAchievement.isMystery 
                  ? 'Ovaj izazov je tajna dok ga ne otključaš!' 
                  : selectedAchievement.description}
              </p>

              {/* Badges layout */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', marginBottom: 12 }}>
                {!selectedAchievement.isComingSoon && selectedAchievement.xp_reward > 0 && (
                  <div className={`achievement-dialog-xp ${selectedAchievement.isUnlocked ? 'unlocked' : 'locked'}`}>
                    ⚡ {selectedAchievement.isMystery ? '?' : selectedAchievement.xp_reward} XP
                  </div>
                )}
                {selectedAchievement.isComingSoon && selectedAchievement.xp_reward > 0 && (
                  <div className="achievement-dialog-xp coming_soon">
                    ⚡ {selectedAchievement.xp_reward} XP
                  </div>
                )}
                {selectedAchievement.isUnlocked && (
                  <div className="achievement-dialog-status-badge">
                    ✓ Otključano
                  </div>
                )}
              </div>

              {/* Actions & Instructions */}
              <div style={{ width: '100%', marginTop: 8 }}>
                {selectedAchievement.link_url && (
                  <a 
                    href={selectedAchievement.link_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn achievement-dialog-action-btn"
                  >
                    Otvori poveznicu <OpenInNewIcon style={{ fontSize: '18px' }} />
                  </a>
                )}

                {!selectedAchievement.isUnlocked && !selectedAchievement.isMystery && !selectedAchievement.isComingSoon && (
                  <div style={{ 
                    fontSize: '0.82rem', 
                    color: 'var(--text-muted)', 
                    textAlign: 'center', 
                    background: 'var(--bg-section-alt)', 
                    padding: '12px 16px', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    lineHeight: 1.4,
                    marginBottom: 12
                  }}>
                    Za otključavanje, unesi kod u polje na vrhu ekrana! 🔑
                  </div>
                )}

                <button 
                  onClick={() => setSelectedAchievement(null)}
                  className="btn btn-outline btn-block"
                  style={{ fontWeight: 700 }}
                >
                  Zatvori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

