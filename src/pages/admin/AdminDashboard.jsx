import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BoltIcon from '@mui/icons-material/Bolt';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    usersCount: 0,
    totalXp: 0,
    completedChallenges: 0,
    pendingApprovals: 0,
  });
  const [pendingQueue, setPendingQueue] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [arenaEnabled, setArenaEnabled] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get stats
      const [usersRes, completedRes, pendingRes] = await Promise.all([
        supabase.from('profiles').select('xp', { count: 'exact' }),
        supabase.from('user_challenges').select('id', { count: 'exact' }).eq('is_completed', true),
        supabase.from('user_challenges').select('id', { count: 'exact' }).is('admin_approved', null).not('proof_url', 'is', null),
      ]);

      const totalXpSum = usersRes.data?.reduce((sum, u) => sum + (u.xp || 0), 0) || 0;

      setStats({
        usersCount: usersRes.count || 0,
        totalXp: totalXpSum,
        completedChallenges: completedRes.count || 0,
        pendingApprovals: pendingRes.count || 0,
      });

      // 2. Get pending queue
      const { data: queueData, error: queueErr } = await supabase
        .from('user_challenges')
        .select(`
          id,
          user_id,
          challenge_id,
          proof_url,
          created_at,
          profiles (name, avatar_url, email),
          challenges (title, xp_reward, description)
        `)
        .is('admin_approved', null)
        .not('proof_url', 'is', null)
        .order('created_at', { ascending: true });

      if (!queueErr && queueData) {
        setPendingQueue(queueData);
      }

      // 3. Fetch Arena Enabled setting
      const { data: arenaSetting } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'arena_enabled')
        .single();
      
      if (arenaSetting && arenaSetting.value) {
        setArenaEnabled(arenaSetting.value.enabled === true || arenaSetting.value === true);
      }

      // 4. Fetch feedbacks
      const { data: fbData, error: fbErr } = await supabase
        .from('feedbacks')
        .select(`
          id,
          text,
          rating,
          created_at,
          profiles (name, email)
        `)
        .order('created_at', { ascending: false });

      if (!fbErr && fbData) {
        setFeedbacks(fbData);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleArena = async () => {
    const newValue = !arenaEnabled;
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'arena_enabled', value: { enabled: newValue } }, { onConflict: 'key' });
      if (error) throw error;
      setArenaEnabled(newValue);
    } catch (err) {
      console.error(err);
      alert('Greška pri izmjeni postavke Arene.');
    }
  };

  const handleApprove = async (submission) => {
    setActioningId(submission.id);
    try {
      // 1. Update user challenge
      const { error: updateErr } = await supabase
        .from('user_challenges')
        .update({
          admin_approved: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateErr) throw updateErr;

      // 2. Award XP to the user
      const { error: rpcErr } = await supabase.rpc('award_xp', {
        p_user_id: submission.user_id,
        p_xp_amount: submission.challenges?.xp_reward || 10,
      });

      if (rpcErr) throw rpcErr;

      // Refresh list
      await fetchDashboardData();
    } catch (err) {
      console.error('Approval error:', err);
      alert('Došlo je do greške prilikom odobravanja.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (submissionId) => {
    if (!confirm('Jeste li sigurni da želite odbiti ovaj dokaz? Ovo će obrisati prijavu izazova.')) return;
    setActioningId(submissionId);
    try {
      // Delete the record to reset progress so user can try again
      const { error } = await supabase
        .from('user_challenges')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      await fetchDashboardData();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Došlo je do greške prilikom odbijanja.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading && pendingQueue.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Nadzorna ploča</h1>
        <button className="btn btn-outline" onClick={fetchDashboardData}>Osvježi</button>
      </div>

      {/* Settings Panel */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: 28,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-dark)' }}>
            ⚔️ Postavke Arene (PvP)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', margin: '4px 0 0' }}>
            Omogući ili onemogući prikaz Arene i PvP izazova za sve korisnike.
          </p>
        </div>
        <button
          className={`btn ${arenaEnabled ? 'btn-primary' : 'btn-outline'}`}
          onClick={handleToggleArena}
          style={{
            minWidth: 150,
            background: arenaEnabled ? 'var(--prisa-orange)' : 'transparent',
            color: arenaEnabled ? '#fff' : 'var(--text-dark)',
            borderColor: 'var(--prisa-orange)'
          }}
        >
          {arenaEnabled ? 'Arena: Aktivna ✅' : 'Arena: Ugašena ❌'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="admin-stat-label">Ukupno Korisnika</div>
            <PeopleIcon style={{ color: 'var(--prisa-blue)' }} />
          </div>
          <div className="admin-stat-value">{stats.usersCount}</div>
        </div>

        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="admin-stat-label">Ukupno XP</div>
            <BoltIcon style={{ color: 'var(--prisa-orange)' }} />
          </div>
          <div className="admin-stat-value">{stats.totalXp}</div>
        </div>

        <div className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="admin-stat-label">Riješeno izazova</div>
            <EmojiEventsIcon style={{ color: 'var(--prisa-teal)' }} />
          </div>
          <div className="admin-stat-value">{stats.completedChallenges}</div>
        </div>

        <div className="admin-stat-card" style={{ border: stats.pendingApprovals > 0 ? '1px solid var(--prisa-orange)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="admin-stat-label">Čeka odobrenje</div>
            <HourglassEmptyIcon style={{ color: stats.pendingApprovals > 0 ? 'var(--prisa-orange)' : 'var(--text-muted)' }} />
          </div>
          <div className="admin-stat-value" style={{ color: stats.pendingApprovals > 0 ? 'var(--prisa-orange)' : 'inherit' }}>
            {stats.pendingApprovals}
          </div>
        </div>
      </div>

      {/* Verification queue section */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>
          📥 Red za provjeru slika ({pendingQueue.length})
        </h2>

        {pendingQueue.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 'var(--radius-lg)',
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            Nema neriješenih foto-izazova koji čekaju odobrenje! 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingQueue.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: 20,
                  alignItems: 'center'
                }}
              >
                {/* Proof Photo */}
                <a href={item.proof_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={item.proof_url}
                    alt="Dokaz"
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}
                  />
                </a>

                {/* Details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)' }}>
                      {item.profiles?.name || 'Korisnik'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)' }}>
                      ({item.profiles?.email})
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--prisa-orange)',
                    marginBottom: 4
                  }}>
                    {item.challenges?.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-gray)', marginBottom: 8 }}>
                    {item.challenges?.description}
                  </p>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--prisa-orange)' }}>⚡ {item.challenges?.xp_reward} XP</span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Poslano: {new Date(item.created_at).toLocaleString('hr-HR')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--prisa-teal)', border: 'none', minWidth: 100 }}
                    onClick={() => handleApprove(item)}
                    disabled={actioningId !== null}
                  >
                    {actioningId === item.id ? (
                      <span className="loading-spinner" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
                    ) : (
                      <>
                        <CheckIcon style={{ fontSize: 16, marginRight: 4, verticalAlign: 'middle' }} />
                        Odobri
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ borderColor: '#ef4444', color: '#ef4444', minWidth: 100 }}
                    onClick={() => handleReject(item.id)}
                    disabled={actioningId !== null}
                  >
                    {actioningId === item.id ? (
                      <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                      <>
                        <CloseIcon style={{ fontSize: 16, marginRight: 4, verticalAlign: 'middle' }} />
                        Odbij
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback panel section */}
      <div style={{ marginTop: 40, marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>
          💬 Povratne informacije korisnika ({feedbacks.length})
        </h2>

        {feedbacks.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 'var(--radius-lg)',
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            Još nema zaprimljenih povratnih informacija.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--text-dark)' }}>
                      {fb.profiles?.name || 'Korisnik'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginLeft: 8 }}>
                      ({fb.profiles?.email || 'Nema e-maila'})
                    </span>
                  </div>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                    {Array(fb.rating).fill('⭐').join('')}
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-dark)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                  "{fb.text}"
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Poslano: {new Date(fb.created_at).toLocaleString('hr-HR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
