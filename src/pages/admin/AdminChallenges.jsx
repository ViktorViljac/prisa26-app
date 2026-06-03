import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const INITIAL_FORM = {
  title: '',
  description: '',
  category_id: '',
  xp_reward: 10,
  target_count: 1,
  unit: 'puta',
  verification_type: 'self_report',
  visibility: 'visible',
  start_date: '',
  end_date: '',
  is_daily: false,
};

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [challengesRes, categoriesRes] = await Promise.all([
        supabase
          .from('challenges')
          .select('*, challenge_categories(name)')
          .order('created_at', { ascending: false }),
        supabase.from('challenge_categories').select('*').order('sort_order'),
      ]);

      if (challengesRes.data) setChallenges(challengesRes.data);
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
        if (categoriesRes.data.length > 0 && !form.category_id) {
          setForm(prev => ({ ...prev, category_id: categoriesRes.data[0].id }));
        }
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
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.category_id) {
      alert('Molimo ispunite sva obavezna polja.');
      return;
    }

    try {
      const payload = {
        ...form,
        xp_reward: parseInt(form.xp_reward) || 0,
        target_count: parseInt(form.target_count) || 1,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('challenges')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('challenges').insert(payload);
        if (error) throw error;
      }

      setForm({ ...INITIAL_FORM, category_id: categories[0]?.id || '' });
      setEditingId(null);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja izazova.');
    }
  };

  const handleEdit = (challenge) => {
    setForm({
      title: challenge.title || '',
      description: challenge.description || '',
      category_id: challenge.category_id || '',
      xp_reward: challenge.xp_reward || 10,
      target_count: challenge.target_count || 1,
      unit: challenge.unit || 'puta',
      verification_type: challenge.verification_type || 'self_report',
      visibility: challenge.visibility || 'visible',
      start_date: challenge.start_date || '',
      end_date: challenge.end_date || '',
      is_daily: challenge.is_daily || false,
    });
    setEditingId(challenge.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj izazov?')) return;
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom brisanja izazova.');
    }
  };

  if (loading && challenges.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Upravljanje Izazovima</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setForm({ ...INITIAL_FORM, category_id: categories[0]?.id || '' });
              setEditingId(null);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <AddIcon />
          {showForm ? 'Zatvori Obrazac' : 'Dodaj Izazov'}
        </button>
      </div>

      {/* Challenge Form */}
      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
            {editingId ? '📝 Uredi Izazov' : '✨ Stvori Novi Izazov'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="admin-form-row">
              <div className="form-group">
                <label>Naslov Izazova *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="npr. 10.000 koraka"
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategorija *</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'var(--bg-paper)',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-body)',
                  }}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Opis Izazova</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Detaljan opis izazova..."
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
                <label>Cilj (Količina)</label>
                <input
                  type="number"
                  name="target_count"
                  value={form.target_count}
                  onChange={handleInputChange}
                  min="1"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Mjerna Jedinica</label>
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleInputChange}
                  placeholder="npr. koraka, minuta, knjiga"
                />
              </div>

              <div className="form-group">
                <label>Način Provjere</label>
                <select
                  name="verification_type"
                  value={form.verification_type}
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
                  <option value="self_report">Klik / Samoprijava</option>
                  <option value="field_input">Brojčani Unos</option>
                  <option value="photo_upload">Učitavanje Fotografije (čeka odobrenje)</option>
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Vidljivost</label>
                <select
                  name="visibility"
                  value={form.visibility}
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
                  <option value="visible">Vidljivo</option>
                  <option value="coming_soon">Uskoro Stiže</option>
                  <option value="hidden">Skriveno</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                  <input
                    type="checkbox"
                    name="is_daily"
                    checked={form.is_daily}
                    onChange={handleInputChange}
                    style={{ width: 20, height: 20 }}
                  />
                  Dnevni izazov (resetira se svaki dan)
                </label>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Datum Početka (opcionalno)</label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Datum Završetka (opcionalno)</label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {editingId ? 'Spremi Izmjene' : 'Stvori Izazov'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setForm({ ...INITIAL_FORM, category_id: categories[0]?.id || '' });
                  setEditingId(null);
                }}
              >
                Odustani
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Challenges list table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Izazov</th>
              <th>Kategorija</th>
              <th>XP Nagrada</th>
              <th>Cilj</th>
              <th>Tip Provjere</th>
              <th>Vidljivost</th>
              <th>Dnevni</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{c.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.description || 'Nema opisa.'}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      background: 'var(--bg-paper)',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {c.challenge_categories?.name || 'N/A'}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: 'var(--prisa-orange)' }}>⚡ {c.xp_reward} XP</td>
                <td>{c.target_count} {c.unit}</td>
                <td>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {c.verification_type === 'self_report' && 'Samoprijava'}
                    {c.verification_type === 'field_input' && 'Brojčani unos'}
                    {c.verification_type === 'photo_upload' && 'Foto dokaz'}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color:
                        c.visibility === 'visible'
                          ? 'var(--prisa-teal)'
                          : c.visibility === 'coming_soon'
                          ? 'var(--prisa-blue)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {c.visibility === 'visible' && 'VIDLJIVO'}
                    {c.visibility === 'coming_soon' && 'USKORO'}
                    {c.visibility === 'hidden' && 'SKRIVENO'}
                  </span>
                </td>
                <td style={{ fontWeight: 700 }}>{c.is_daily ? 'DA' : 'NE'}</td>
                <td>
                  <div className="admin-actions-cell">
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleEdit(c)}
                    >
                      <EditIcon style={{ fontSize: 14 }} />
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => handleDelete(c.id)}
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {challenges.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  Nema stvorenih izazova. Kliknite na "Dodaj Izazov" za izradu!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
