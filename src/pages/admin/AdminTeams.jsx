import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [editingTeam, setEditingTeam] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '', color: '', score: 0 });
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('teams').select('*').order('score', { ascending: false });
      if (!error && data) {
        setTeams(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setForm({
      name: team.name || '',
      icon: team.icon || '',
      color: team.color || '',
      score: team.score || 0,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({
          name: form.name,
          icon: form.icon,
          color: form.color,
          score: parseInt(form.score) || 0,
        })
        .eq('id', editingTeam.id);

      if (error) throw error;
      setEditingTeam(null);
      await fetchTeams();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja tima.');
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Upravljanje Timovima</h1>
        <button className="btn btn-outline" onClick={fetchTeams}>Osvježi</button>
      </div>

      {/* Edit Form */}
      {editingTeam && (
        <div className="admin-form-card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
            📝 Uredi Tim: {editingTeam.name}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Naziv Tima *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Emoji ikona (npr. ⭐, 🌿, 💎)</label>
                <input
                  type="text"
                  name="icon"
                  value={form.icon}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Boja tima (HEX kod, npr. #3b82f6)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="color"
                    name="color"
                    value={form.color}
                    onChange={handleInputChange}
                    style={{ width: 44, padding: 0, height: 42, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    name="color"
                    value={form.color}
                    onChange={handleInputChange}
                    placeholder="#ffffff"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bodovi (Score)</label>
                <input
                  type="number"
                  name="score"
                  value={form.score}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Spremi Promjene
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditingTeam(null)}
              >
                Odustani
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams list */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ikona</th>
              <th>Naziv Tima</th>
              <th>Boja</th>
              <th>Bodovi (Score)</th>
              <th>Broj Članova</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td style={{ fontSize: '2rem', textAlign: 'center', width: 60 }}>{t.icon || '🏳️'}</td>
                <td style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1rem' }}>{t.name}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: t.color,
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.color}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 800, color: 'var(--prisa-orange)', fontSize: '1rem' }}>
                  {t.score || 0} XP
                </td>
                <td>{t.member_count || 0} igrača</td>
                <td>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    onClick={() => handleEditClick(t)}
                  >
                    <EditIcon style={{ fontSize: 14 }} />
                    Uredi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
