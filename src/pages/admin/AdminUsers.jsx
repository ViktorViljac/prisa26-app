import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailForm, setDetailForm] = useState({
    xp: 0,
    hide_from_leaderboard: false,
    role: 'user',
    team_id: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes] = await Promise.all([
        supabase.from('profiles').select('*, teams(name, icon)').order('xp', { ascending: false }),
        supabase.from('teams').select('*').order('name'),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (teamsRes.data) setTeams(teamsRes.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetails = (user) => {
    setSelectedUser(user);
    setDetailForm({
      xp: user.xp || 0,
      hide_from_leaderboard: user.hide_from_leaderboard || false,
      role: user.role || 'user',
      team_id: user.team_id || '',
    });
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setUpdatingId(selectedUser.id);
    try {
      const newXp = parseInt(detailForm.xp) || 0;
      const newLevel = Math.floor(newXp / 500) + 1;

      const { error } = await supabase
        .from('profiles')
        .update({
          xp: newXp,
          level: newLevel,
          hide_from_leaderboard: detailForm.hide_from_leaderboard,
          role: detailForm.role,
          team_id: detailForm.team_id === '' ? null : detailForm.team_id,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja detalja korisnika.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBanToggle = async (userId, isBanned) => {
    const action = isBanned ? 'deblokirati' : 'blokirati';
    if (!confirm(`Jeste li sigurni da želite ${action} ovog korisnika?`)) return;

    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !isBanned })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({ ...prev, is_banned: !isBanned }));
      }
    } catch (err) {
      console.error(err);
      alert('Greška prilikom promjene statusa blokade.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  if (loading && users.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Upravljanje Korisnicima</h1>
        <button className="btn btn-outline" onClick={fetchData}>Osvježi</button>
      </div>

      {/* Search Input */}
      <div className="unlock-code-row" style={{ maxWidth: 400, marginBottom: 24 }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <SearchIcon style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pretraži po imenu ili emailu..."
            style={{
              paddingLeft: 40,
              width: '100%',
              letterSpacing: 'normal',
              textTransform: 'none',
              fontWeight: 500,
            }}
          />
        </div>
      </div>

      {/* Users table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Korisnik</th>
              <th>Uloga</th>
              <th>Tim</th>
              <th>XP / Razina</th>
              <th>Leaderboard</th>
              <th>Status</th>
              <th style={{ width: 220 }}>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ opacity: u.is_banned ? 0.6 : 1 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'var(--prisa-orange-light)',
                        color: 'var(--prisa-orange)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                      }}
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        u.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {u.role === 'admin' ? '👑 Admin' : 'Korisnik'}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                    {u.teams ? `${u.teams.icon} ${u.teams.name}` : 'Nema tima'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--prisa-orange)' }}>{u.xp || 0} XP</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>Razina {u.level || 1}</div>
                </td>
                <td>
                  {u.hide_from_leaderboard ? (
                    <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.75rem' }}>Skriven 👁️‍🗨️</span>
                  ) : (
                    <span style={{ color: 'var(--prisa-teal)', fontWeight: 600, fontSize: '0.75rem' }}>Vidljiv 👁️</span>
                  )}
                </td>
                <td>
                  {u.is_banned ? (
                    <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.75rem' }}>BLOKIRAN</span>
                  ) : (
                    <span style={{ color: 'var(--prisa-teal)', fontWeight: 800, fontSize: '0.75rem' }}>AKTIVAN</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleOpenDetails(u)}
                    >
                      <EditIcon style={{ fontSize: 14, marginRight: 2 }} />
                      Uredi
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        borderColor: u.is_banned ? 'var(--prisa-teal)' : '#ef4444',
                        color: u.is_banned ? 'var(--prisa-teal)' : '#ef4444',
                      }}
                      onClick={() => handleBanToggle(u.id, u.is_banned)}
                      disabled={updatingId === u.id}
                    >
                      {u.is_banned ? 'Odblokiraj' : 'Blokiraj'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  Nema korisnika koji odgovaraju pretrazi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="dialog-overlay" onClick={() => setSelectedUser(null)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>
              👤 Detalji Korisnika: {selectedUser.name}
            </h2>

            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Ukupno XP</label>
                <input
                  type="number"
                  value={detailForm.xp}
                  onChange={(e) => setDetailForm(prev => ({ ...prev, xp: parseInt(e.target.value) || 0 }))}
                  min={0}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Razina se automatski preračunava (Svakih 500 XP = 1 razina). Trenutna razina: {Math.floor(detailForm.xp / 500) + 1}
                </span>
              </div>

              <div className="form-group">
                <label>Uloga u aplikaciji</label>
                <select
                  value={detailForm.role}
                  onChange={(e) => setDetailForm(prev => ({ ...prev, role: e.target.value }))}
                  style={{ height: 42 }}
                >
                  <option value="user">Korisnik (User)</option>
                  <option value="admin">Administrator (Admin)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tim</label>
                <select
                  value={detailForm.team_id}
                  onChange={(e) => setDetailForm(prev => ({ ...prev, team_id: e.target.value }))}
                  style={{ height: 42 }}
                >
                  <option value="">Nema tima</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input
                  id="hide_leaderboard_cb"
                  type="checkbox"
                  checked={detailForm.hide_from_leaderboard}
                  onChange={(e) => setDetailForm(prev => ({ ...prev, hide_from_leaderboard: e.target.checked }))}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="hide_leaderboard_cb" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  Sakrij korisnika s rang liste (Leaderboard)
                </label>
              </div>

              <div style={{
                background: 'var(--prisa-orange-pastel)',
                padding: 12,
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--prisa-orange)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div><strong>🔥 Vatrice (Streak):</strong> {selectedUser.streak || 0} dana</div>
                <div><strong>🏆 Najveći streak:</strong> {selectedUser.longest_streak || 0} dana</div>
                <div><strong>📧 Email:</strong> {selectedUser.email}</div>
                <div><strong>🚫 Status računa:</strong> {selectedUser.is_banned ? 'Blokiran' : 'Aktivan'}</div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', flex: 1 }}
                  disabled={updatingId !== null}
                >
                  {updatingId ? 'Spremanje...' : 'Spremi Promjene'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedUser(null)}
                  style={{ flex: 1 }}
                >
                  Zatvori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
