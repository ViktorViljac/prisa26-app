import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function AdminLevels() {
  const [levels, setLevels] = useState([]);
  const [editingLevel, setEditingLevel] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    level: 1,
    name: '',
    icon: '⭐',
    xp: 0,
  });

  const fetchLevels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('level', { ascending: true });
      if (!error && data) {
        setLevels(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: (name === 'level' || name === 'xp') ? parseInt(value) || 0 : value,
    }));
  };

  const handleEditClick = (lvl) => {
    setEditingLevel(lvl);
    setIsAdding(false);
    setForm({
      level: lvl.level,
      name: lvl.name || '',
      icon: lvl.icon || '⭐',
      xp: lvl.xp || 0,
    });
  };

  const handleAddClick = () => {
    setEditingLevel(null);
    setIsAdding(true);
    // Suggest the next level number
    const maxLevel = levels.reduce((max, l) => (l.level > max ? l.level : max), 0);
    setForm({
      level: maxLevel + 1,
      name: '',
      icon: '⭐',
      xp: maxLevel * 500,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.level) return;

    try {
      if (editingLevel) {
        // Since primary key is 'level', if they changed the level number we have to be careful, but we typically keep it read-only during edit
        const { error } = await supabase
          .from('levels')
          .update({
            name: form.name,
            icon: form.icon,
            xp: form.xp,
          })
          .eq('level', editingLevel.level);

        if (error) throw error;
        setEditingLevel(null);
      } else {
        // Create
        // Check if level already exists
        const exists = levels.some((l) => l.level === form.level);
        if (exists) {
          alert(`Razina ${form.level} već postoji! Koristi 'Uredi' ako je želiš izmijeniti.`);
          return;
        }

        const { error } = await supabase
          .from('levels')
          .insert([
            {
              level: form.level,
              name: form.name,
              icon: form.icon,
              xp: form.xp,
            },
          ]);

        if (error) throw error;
        setIsAdding(false);
      }

      await fetchLevels();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja razine.');
    }
  };

  const handleDelete = async (levelNum, name) => {
    if (!confirm(`Jesi li siguran da želiš obrisati razinu ${levelNum} (${name})?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('levels')
        .delete()
        .eq('level', levelNum);

      if (error) throw error;
      await fetchLevels();
    } catch (err) {
      console.error(err);
      alert('Greška pri brisanju razine.');
    }
  };

  if (loading && levels.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Upravljanje Razinama</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" onClick={fetchLevels}>Osvježi</button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            <AddIcon style={{ fontSize: 18, marginRight: 4 }} /> Dodaj Razinu
          </button>
        </div>
      </div>

      {/* Form (Add or Edit) */}
      {(editingLevel || isAdding) && (
        <div className="admin-form-card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
            {editingLevel ? `📝 Uredi Razinu: ${editingLevel.level}` : '✨ Nova Razina'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-form-row">
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label>Broj Razine *</label>
                <input
                  type="number"
                  name="level"
                  value={form.level}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingLevel}
                  min={1}
                />
              </div>

              <div className="form-group">
                <label>Naziv Razine *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  required
                  placeholder="npr. Besmrtnik"
                />
              </div>

              <div className="form-group" style={{ maxWidth: 200 }}>
                <label>Emoji ikona</label>
                <input
                  type="text"
                  name="icon"
                  value={form.icon}
                  onChange={handleInputChange}
                  placeholder="npr. 🌌"
                />
              </div>

              <div className="form-group" style={{ maxWidth: 200 }}>
                <label>XP Prag (Uvjet) *</label>
                <input
                  type="number"
                  name="xp"
                  value={form.xp}
                  onChange={handleInputChange}
                  required
                  min={0}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {editingLevel ? 'Spremi Promjene' : 'Dodaj Razinu'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditingLevel(null);
                  setIsAdding(false);
                }}
              >
                Odustani
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Levels List */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Broj Razine</th>
              <th style={{ width: 80 }}>Ikona</th>
              <th>Naziv Razine</th>
              <th>XP Prag (Uvjet)</th>
              <th style={{ width: 160 }}>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((l) => (
              <tr key={l.level}>
                <td style={{ fontWeight: 800, textAlign: 'center', color: 'var(--text-dark)' }}>
                  {l.level}
                </td>
                <td style={{ fontSize: '1.8rem', textAlign: 'center' }}>
                  {l.icon}
                </td>
                <td style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1rem' }}>
                  {l.name}
                </td>
                <td style={{ color: 'var(--text-gray)' }}>
                  {l.xp !== undefined && l.xp !== null ? l.xp : (l.level - 1) * 500} XP
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleEditClick(l)}
                    >
                      <EditIcon style={{ fontSize: 14 }} />
                      Uredi
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#ef4444', borderColor: '#fee2e2' }}
                      onClick={() => handleDelete(l.level, l.name)}
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                      Obriši
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
