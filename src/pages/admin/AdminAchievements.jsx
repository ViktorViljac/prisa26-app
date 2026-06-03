import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const INITIAL_FORM = {
  title: '',
  description: '',
  icon: '🏅',
  xp_reward: 50,
  unlock_code: '',
  condition_type: 'code',
  sort_order: 0,
};

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAchievements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) {
      alert('Molimo ispunite naslov.');
      return;
    }

    try {
      const payload = {
        ...form,
        xp_reward: parseInt(form.xp_reward) || 0,
        sort_order: parseInt(form.sort_order) || 0,
        unlock_code: form.unlock_code ? form.unlock_code.toUpperCase().trim() : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('achievements')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('achievements').insert(payload);
        if (error) throw error;
      }

      setForm(INITIAL_FORM);
      setEditingId(null);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja postignuća.');
    }
  };

  const handleEdit = (ach) => {
    setForm({
      title: ach.title || '',
      description: ach.description || '',
      icon: ach.icon || '🏅',
      xp_reward: ach.xp_reward || 0,
      unlock_code: ach.unlock_code || '',
      condition_type: ach.condition_type || 'code',
      sort_order: ach.sort_order || 0,
    });
    setEditingId(ach.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovo postignuće?')) return;
    try {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom brisanja postignuća.');
    }
  };

  if (loading && achievements.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Upravljanje Postignućima</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setForm(INITIAL_FORM);
              setEditingId(null);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <AddIcon />
          {showForm ? 'Zatvori Obrazac' : 'Dodaj Postignuće'}
        </button>
      </div>

      {/* Achievement Form */}
      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
            {editingId ? '📝 Uredi Postignuće' : '✨ Stvori Novo Postignuće'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Naslov Postignuća *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="npr. Ranooranilac"
                  required
                />
              </div>

              <div className="form-group">
                <label>Emoji ikona (npr. 🏅, 🏆, 🔥)</label>
                <input
                  type="text"
                  name="icon"
                  value={form.icon}
                  onChange={handleInputChange}
                  placeholder="Ikona"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Opis Postignuća</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Kako otključati ovo postignuće..."
                rows="3"
                style={{
                  width: '100%',
                  background: 'var(--bg-paper)',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-body)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>XP Nagrada</label>
                <input
                  type="number"
                  name="xp_reward"
                  value={form.xp_reward}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Redoslijed Prikaza (Sort)</label>
                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Tip Uvjeta</label>
                <select
                  name="condition_type"
                  value={form.condition_type}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'var(--bg-paper)',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <option value="code">Kod za Otključavanje</option>
                  <option value="auto">Automatski (Dovršeni izazovi, ELO, itd.)</option>
                  <option value="admin">Ručno odobrenje admina</option>
                </select>
              </div>

              <div className="form-group">
                <label>Kod za Otključavanje (samo ako je tip uvjeta Kod)</label>
                <input
                  type="text"
                  name="unlock_code"
                  value={form.unlock_code}
                  onChange={handleInputChange}
                  placeholder="npr. PRISA2026"
                  style={{ textTransform: 'uppercase' }}
                  disabled={form.condition_type !== 'code'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {editingId ? 'Spremi Izmjene' : 'Stvori Postignuće'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setForm(INITIAL_FORM);
                  setEditingId(null);
                }}
              >
                Odustani
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Achievements List */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ikona</th>
              <th>Naslov i Opis</th>
              <th>XP Nagrada</th>
              <th>Tip Uvjeta</th>
              <th>Kod</th>
              <th>Sort</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map((a) => (
              <tr key={a.id}>
                <td style={{ fontSize: '1.8rem', textAlign: 'center', width: 60 }}>{a.icon || '🏅'}</td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{a.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{a.description}</div>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--prisa-orange)' }}>⚡ {a.xp_reward} XP</td>
                <td>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {a.condition_type === 'code' && 'Kod'}
                    {a.condition_type === 'auto' && 'Automatski'}
                    {a.condition_type === 'admin' && 'Ručno'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5 }}>
                  {a.unlock_code ? a.unlock_code : '—'}
                </td>
                <td>{a.sort_order}</td>
                <td>
                  <div className="admin-actions-cell">
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleEdit(a)}
                    >
                      <EditIcon style={{ fontSize: 14 }} />
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => handleDelete(a.id)}
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {achievements.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  Nema stvorenih postignuća.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
