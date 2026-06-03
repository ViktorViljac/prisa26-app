import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

  const handleTeamChange = async (userId, teamId) => {
    setUpdatingId(userId);
    try {
      const val = teamId === '' ? null : teamId;
      const { error } = await supabase
        .from('profiles')
        .update({ team_id: val })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom izmjene tima.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom izmjene uloge.');
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
              <th>Streak</th>
              <th>Status</th>
              <th>Uredi</th>
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
                  <select
                    value={u.role || 'user'}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={updatingId === u.id}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <option value="user">Korisnik</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <select
                    value={u.team_id || ''}
                    onChange={(e) => handleTeamChange(u.id, e.target.value)}
                    disabled={updatingId === u.id}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <option value="">Nema tima</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--prisa-orange)' }}>{u.xp || 0} XP</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>Razina {u.level || 1}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 700 }}>{u.streak || 0} 🔥</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>Najviše: {u.longest_streak || 0}</div>
                </td>
                <td>
                  {u.is_banned ? (
                    <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.75rem' }}>BLOKIRAN</span>
                  ) : (
                    <span style={{ color: 'var(--prisa-teal)', fontWeight: 800, fontSize: '0.75rem' }}>AKTIVAN</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-outline"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.78rem',
                      borderColor: u.is_banned ? 'var(--prisa-teal)' : '#ef4444',
                      color: u.is_banned ? 'var(--prisa-teal)' : '#ef4444',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                    onClick={() => handleBanToggle(u.id, u.is_banned)}
                    disabled={updatingId === u.id}
                  >
                    {u.is_banned ? (
                      <>
                        <CheckCircleIcon style={{ fontSize: 14 }} />
                        Odblokiraj
                      </>
                    ) : (
                      <>
                        <BlockIcon style={{ fontSize: 14 }} />
                        Blokiraj
                      </>
                    )}
                  </button>
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
    </div>
  );
}
