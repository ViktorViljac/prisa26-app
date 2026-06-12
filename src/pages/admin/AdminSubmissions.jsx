import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const STATUS_LABELS = {
  all: 'Sve',
  pending: 'Na čekanju',
  approved: 'Odobreno',
  rejected: 'Odbijeno',
};

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  // Filters
  const [filterChallenge, setFilterChallenge] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'photo' | 'text'

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all submissions that have proof_url OR field-input text
      // We include both photo and field_input types
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          id,
          user_id,
          challenge_id,
          progress,
          proof_url,
          is_completed,
          admin_approved,
          date,
          created_at,
          profiles (id, name, avatar_url, email),
          challenges (id, title, description, xp_reward, verification_type, target_count, unit)
        `)
        .not('proof_url', 'is', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSubmissions(data);
      }

      // Also fetch all challenges with photo or field_input verification for filter
      const { data: chalData } = await supabase
        .from('challenges')
        .select('id, title, verification_type')
        .in('verification_type', ['photo_upload', 'field_input'])
        .order('title');

      if (chalData) setChallenges(chalData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (item) => {
    setActioningId(item.id);
    try {
      const { error: updateErr } = await supabase
        .from('user_challenges')
        .update({
          admin_approved: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (updateErr) throw updateErr;

      await supabase.rpc('award_xp', {
        p_user_id: item.user_id,
        p_xp_amount: item.challenges?.xp_reward || 10,
      });

      await fetchData();
    } catch (err) {
      console.error('Approval error:', err);
      alert('Greška pri odobravanju.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Odbiti ovaj dokaz? Korisnik će moći pokušati ponovo.')) return;
    setActioningId(id);
    try {
      await supabase.from('user_challenges').delete().eq('id', id);
      await fetchData();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Greška pri odbijanju.');
    } finally {
      setActioningId(null);
    }
  };

  // Apply filters
  const filtered = submissions.filter((item) => {
    if (filterChallenge !== 'all' && item.challenge_id !== filterChallenge) return false;
    if (filterDate && item.date !== filterDate) return false;
    if (filterType === 'photo' && item.challenges?.verification_type !== 'photo_upload') return false;
    if (filterType === 'text' && item.challenges?.verification_type !== 'field_input') return false;
    if (filterStatus === 'pending' && (item.admin_approved !== null)) return false;
    if (filterStatus === 'approved' && item.admin_approved !== true) return false;
    if (filterStatus === 'rejected' && !(item.admin_approved === false || (!item.admin_approved && item.is_completed === false && item.proof_url))) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce((acc, item) => {
    const d = item.date || item.created_at?.split('T')[0] || 'Nepoznato';
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const pendingCount = submissions.filter(s => s.admin_approved === null).length;

  const formatDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}.`;
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">
          📋 Predaje
          {pendingCount > 0 && (
            <span style={{
              marginLeft: 12,
              background: 'var(--prisa-orange)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 100,
              verticalAlign: 'middle',
            }}>
              {pendingCount} čeka
            </span>
          )}
        </h1>
        <button className="btn btn-outline" onClick={fetchData}>Osvježi</button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
      }}>
        <FilterListIcon style={{ color: 'var(--text-muted)' }} />

        {/* Status */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: filterStatus === val ? 'var(--prisa-orange)' : '#f1f5f9',
                color: filterStatus === val ? '#fff' : 'var(--text-dark)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.1)' }} />

        {/* Type */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'Sve vrste'], ['photo', '📸 Foto'], ['text', '📝 Tekst']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterType(val)}
              style={{
                padding: '6px 14px',
                borderRadius: 100,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: filterType === val ? 'var(--prisa-blue)' : '#f1f5f9',
                color: filterType === val ? '#fff' : 'var(--text-dark)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.1)' }} />

        {/* Challenge filter */}
        <select
          value={filterChallenge}
          onChange={e => setFilterChallenge(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}
        >
          <option value="all">Sve navike</option>
          {challenges.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        {/* Date filter */}
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}
        />
        {filterDate && (
          <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
            ✕ Poništi datum
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="loading-spinner" />
        </div>
      ) : sortedDates.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-lg)',
          padding: 48,
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          {filterStatus === 'pending' ? '🎉 Nema predaja na čekanju!' : 'Nema predaja za odabrane filtere.'}
        </div>
      ) : (
        sortedDates.map(date => (
          <div key={date} style={{ marginBottom: 40 }}>
            {/* Date header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
            }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-dark)',
              }}>
                📅 {formatDate(date)}
              </div>
              <div style={{
                background: '#f1f5f9',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 100,
              }}>
                {grouped[date].length} predaja
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {grouped[date].map(item => {
                const isPhoto = item.challenges?.verification_type === 'photo_upload';
                const isApproved = item.admin_approved === true;
                const isPending = item.admin_approved === null;
                const isActioning = actioningId === item.id;

                let statusBadge;
                if (isApproved) {
                  statusBadge = { label: '✓ Odobreno', bg: '#dcfce7', color: '#16a34a' };
                } else if (isPending) {
                  statusBadge = { label: '⏳ Na čekanju', bg: '#fff7ed', color: '#ea580c' };
                } else {
                  statusBadge = { label: '✗ Odbijeno', bg: '#fef2f2', color: '#dc2626' };
                }

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: isPending ? '1.5px solid var(--prisa-orange)' : '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20,
                      display: 'grid',
                      gridTemplateColumns: isPhoto ? '140px 1fr auto' : '1fr auto',
                      gap: 20,
                      alignItems: 'start',
                      boxShadow: isPending ? '0 2px 12px rgba(240,113,71,0.08)' : 'var(--shadow-sm)',
                    }}
                  >
                    {/* Photo thumbnail */}
                    {isPhoto && (
                      <div
                        style={{ cursor: 'pointer', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}
                        onClick={() => setLightboxUrl(item.proof_url)}
                      >
                        <img
                          src={item.proof_url}
                          alt="Dokaz"
                          style={{ width: 140, height: 140, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{
                          position: 'absolute', bottom: 6, right: 6,
                          background: 'rgba(0,0,0,0.5)', borderRadius: 6,
                          padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4,
                          color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                        }}>
                          <OpenInNewIcon style={{ fontSize: 12 }} /> Otvori
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div>
                      {/* Challenge + type badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{
                          background: isPhoto ? 'var(--prisa-orange-light)' : 'var(--prisa-blue-light)',
                          color: isPhoto ? 'var(--prisa-orange)' : 'var(--prisa-blue)',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 100,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          {isPhoto ? <ImageIcon style={{ fontSize: 11 }} /> : <TextSnippetIcon style={{ fontSize: 11 }} />}
                          {isPhoto ? 'FOTO' : 'TEKST'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--text-dark)',
                        }}>
                          {item.challenges?.title}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: statusBadge.bg,
                          color: statusBadge.color,
                        }}>
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* User info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        {item.profiles?.avatar_url ? (
                          <img src={item.profiles.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--prisa-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                            {item.profiles?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                          {item.profiles?.name || 'Korisnik'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>
                          {item.profiles?.email}
                        </span>
                      </div>

                      {/* For field_input: show the progress value as the "text" */}
                      {!isPhoto && (
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 14px',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.9rem',
                          color: 'var(--text-dark)',
                          marginBottom: 8,
                          fontWeight: 600,
                        }}>
                          <TextSnippetIcon style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6, color: 'var(--prisa-blue)' }} />
                          Unos: <strong>{item.progress}</strong> {item.challenges?.unit || ''}
                          {' '}/ {item.challenges?.target_count} {item.challenges?.unit || ''}
                        </div>
                      )}

                      {/* XP + time */}
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>⚡ {item.challenges?.xp_reward} XP</span>
                        <span>🕐 {new Date(item.created_at).toLocaleString('hr-HR')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'center' }}>
                      {isPending && (
                        <>
                          <button
                            className="btn btn-primary"
                            style={{ background: 'var(--prisa-teal)', border: 'none', minWidth: 100 }}
                            onClick={() => handleApprove(item)}
                            disabled={isActioning}
                          >
                            {isActioning ? <span className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} /> : (
                              <><CheckIcon style={{ fontSize: 16, marginRight: 4, verticalAlign: 'middle' }} />Odobri</>
                            )}
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ borderColor: '#ef4444', color: '#ef4444', minWidth: 100 }}
                            onClick={() => handleReject(item.id)}
                            disabled={isActioning}
                          >
                            {isActioning ? <span className="loading-spinner" style={{ width: 14, height: 14 }} /> : (
                              <><CloseIcon style={{ fontSize: 16, marginRight: 4, verticalAlign: 'middle' }} />Odbij</>
                            )}
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textAlign: 'center' }}>
                          ✓ Obrađeno
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt="Dokaz"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}
          />
          <a
            href={lightboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 20, right: 72,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <OpenInNewIcon style={{ fontSize: 16 }} /> Otvori original
          </a>
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '8px 14px',
              fontSize: '1.2rem', cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
