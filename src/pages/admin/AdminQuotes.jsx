import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const INITIAL_FORM = {
  text: '',
  author: '',
  scheduled_date: '',
  is_active: true,
  sort_order: 0,
};

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_quotes')
        .select('*')
        .order('scheduled_date', { ascending: false, nullsFirst: false })
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setQuotes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
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
    if (!form.text) {
      alert('Molimo unesite tekst citata.');
      return;
    }

    try {
      const payload = {
        ...form,
        sort_order: parseInt(form.sort_order) || 0,
        scheduled_date: form.scheduled_date || null,
        author: form.author || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('daily_quotes')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_quotes').insert(payload);
        if (error) throw error;
      }

      setForm(INITIAL_FORM);
      setEditingId(null);
      setShowForm(false);
      await fetchQuotes();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom spremanja citata.');
    }
  };

  const handleEdit = (quote) => {
    setForm({
      text: quote.text || '',
      author: quote.author || '',
      scheduled_date: quote.scheduled_date || '',
      is_active: quote.is_active !== false,
      sort_order: quote.sort_order || 0,
    });
    setEditingId(quote.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovaj citat?')) return;
    try {
      const { error } = await supabase.from('daily_quotes').delete().eq('id', id);
      if (error) throw error;
      await fetchQuotes();
    } catch (err) {
      console.error(err);
      alert('Greška prilikom brisanja citata.');
    }
  };

  if (loading && quotes.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Dnevni Citati</h1>
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
          {showForm ? 'Zatvori Obrazac' : 'Dodaj Citat'}
        </button>
      </div>

      {/* Quote Form */}
      {showForm && (
        <div className="admin-form-card" style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
            {editingId ? '📝 Uredi Citat' : '✨ Stvori Novi Citat'}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Tekst Citata *</label>
              <textarea
                name="text"
                value={form.text}
                onChange={handleInputChange}
                placeholder="Unesite inspirativni citat..."
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
                required
              />
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Autor citata (opcionalno)</label>
                <input
                  type="text"
                  name="author"
                  value={form.author}
                  onChange={handleInputChange}
                  placeholder="npr. Winston Churchill"
                />
              </div>

              <div className="form-group">
                <label>Planirani datum prikazivanja (opcionalno)</label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={form.scheduled_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label>Redoslijed Prikaza (Sort)</label>
                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 24 }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleInputChange}
                    style={{ width: 20, height: 20 }}
                  />
                  Citat je aktivan
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {editingId ? 'Spremi Izmjene' : 'Stvori Citat'}
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

      {/* Quotes List */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Citat</th>
              <th>Autor</th>
              <th>Planirani Datum</th>
              <th>Sort</th>
              <th>Status</th>
              <th>Akcije</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td style={{ maxWidth: 350, fontWeight: 500, color: 'var(--text-dark)', fontStyle: 'italic' }}>
                  "{q.text}"
                </td>
                <td style={{ fontWeight: 700 }}>{q.author || 'Nepoznato'}</td>
                <td>{q.scheduled_date ? new Date(q.scheduled_date).toLocaleDateString('hr-HR') : 'Bilo kada'}</td>
                <td>{q.sort_order}</td>
                <td>
                  {q.is_active ? (
                    <span style={{ color: 'var(--prisa-teal)', fontWeight: 800, fontSize: '0.75rem' }}>AKTIVAN</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem' }}>NEAKTIVAN</span>
                  )}
                </td>
                <td>
                  <div className="admin-actions-cell">
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleEdit(q)}
                    >
                      <EditIcon style={{ fontSize: 14 }} />
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: '#ef4444', color: '#ef4444' }}
                      onClick={() => handleDelete(q.id)}
                    >
                      <DeleteIcon style={{ fontSize: 14 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                  Nema unesenih citata.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
