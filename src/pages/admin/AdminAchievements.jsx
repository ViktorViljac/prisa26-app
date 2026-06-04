import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const INITIAL_FORM = {
  title: '',
  description: '',
  icon: '🏅',
  xp_reward: 50,
  unlock_code: '',
  condition_type: 'code',
  sort_order: 0,
  visibility: 'visible',
  start_date: '',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.`;
}

export default function AdminAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Single-use codes state
  const [selectedAchievementForCodes, setSelectedAchievementForCodes] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [bulkCount, setBulkCount] = useState(10);

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

  const fetchCodes = async (achievementId) => {
    setLoadingCodes(true);
    try {
      const { data, error } = await supabase
        .from('achievement_codes')
        .select('*, profiles(name, email)')
        .eq('achievement_id', achievementId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setCodes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleOpenCodesModal = (ach) => {
    setSelectedAchievementForCodes(ach);
    setBulkCount(10); // reset bulk count
    fetchCodes(ach.id);
  };

  const handleGenerateCodes = async (count = 1) => {
    if (!selectedAchievementForCodes) return;
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
    const newCodes = [];
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 6; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      newCodes.push({
        achievement_id: selectedAchievementForCodes.id,
        code,
        is_used: false,
      });
    }

    try {
      const { error } = await supabase
        .from('achievement_codes')
        .insert(newCodes);
      if (error) throw error;
      await fetchCodes(selectedAchievementForCodes.id);
    } catch (err) {
      console.error(err);
      alert('Greška pri generiranju kodova.');
    }
  };

  const handleCopyUnusedCodes = () => {
    const unused = codes.filter(c => !c.is_used).map(c => c.code);
    if (unused.length === 0) {
      alert('Nema slobodnih kodova za kopiranje.');
      return;
    }
    navigator.clipboard.writeText(unused.join('\n'));
    alert(`Kopirano ${unused.length} slobodnih kodova!`);
  };

  const handleDeleteCode = async (codeId) => {
    if (!confirm('Jesi li siguran da želiš obrisati ovaj kod?')) return;
    try {
      const { error } = await supabase
        .from('achievement_codes')
        .delete()
        .eq('id', codeId);
      if (error) throw error;
      await fetchCodes(selectedAchievementForCodes.id);
    } catch (err) {
      console.error(err);
      alert('Greška pri brisanju koda.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Kod "${text}" je kopiran!`);
  };

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
        visibility: form.visibility || 'visible',
        start_date: form.start_date || null,
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
      visibility: ach.visibility || 'visible',
      start_date: ach.start_date || '',
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
                <label>Zajednički kod (samo ako je tip uvjeta Kod i želiš isti kod za sve)</label>
                <input
                  type="text"
                  name="unlock_code"
                  value={form.unlock_code}
                  onChange={handleInputChange}
                  placeholder="npr. PRISA2026 (Ostavi prazno za jednokratne kodove)"
                  style={{ textTransform: 'uppercase' }}
                  disabled={form.condition_type !== 'code'}
                />
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
                  <option value="visible">Vidljivo (Normalno)</option>
                  <option value="coming_soon">Coming Soon (Uskoro)</option>
                  <option value="mystery">Mystery (Tajna)</option>
                  <option value="hidden">Skriveno</option>
                </select>
              </div>

              <div className="form-group">
                <label>Datum Početka (samo za Coming Soon)</label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    background: 'var(--bg-paper)',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-body)',
                  }}
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
              <th>Zajednički Kod</th>
              <th>Vidljivost</th>
              <th>Sort</th>
              <th style={{ width: 220 }}>Akcije</th>
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
                  {a.unlock_code ? a.unlock_code : a.condition_type === 'code' ? 'Jednokratni kodovi 🎫' : '—'}
                </td>
                <td>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    color: a.visibility === 'visible' 
                      ? 'var(--prisa-teal)' 
                      : a.visibility === 'coming_soon' 
                        ? 'var(--prisa-blue)' 
                        : a.visibility === 'mystery' 
                          ? '#f59e0b' 
                          : 'var(--text-muted)',
                    background: a.visibility === 'visible'
                      ? 'var(--prisa-teal-light)'
                      : a.visibility === 'coming_soon'
                        ? 'var(--prisa-blue-light)'
                        : a.visibility === 'mystery'
                          ? '#fef3c7'
                          : '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {a.visibility === 'visible' && 'Vidljivo'}
                    {a.visibility === 'coming_soon' && `Uskoro (${a.start_date ? formatDate(a.start_date) : '—'})`}
                    {a.visibility === 'mystery' && 'Tajna'}
                    {a.visibility === 'hidden' && 'Skriveno'}
                  </span>
                </td>
                <td>{a.sort_order}</td>
                <td>
                  <div className="admin-actions-cell" style={{ display: 'flex', gap: 8 }}>
                    {a.condition_type === 'code' && !a.unlock_code && (
                      <button
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--prisa-teal)', borderColor: 'rgba(13, 148, 136, 0.2)' }}
                        onClick={() => handleOpenCodesModal(a)}
                      >
                        <VpnKeyIcon style={{ fontSize: 14, marginRight: 2 }} />
                        Kodovi
                      </button>
                    )}
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

      {/* Single-use Codes Manager Modal */}
      {selectedAchievementForCodes && (
        <div className="dialog-overlay" onClick={() => setSelectedAchievementForCodes(null)}>
          <div className="dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 10 }}>
              🎫 Jednokratni Kodovi: {selectedAchievementForCodes.title}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginBottom: 20 }}>
              Generiraj jednokratne kodove koje korisnici mogu iskoristiti za otključavanje ovog postignuća. Svaki kod se može iskoristiti samo jednom.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, background: '#f8fafc', padding: 12, borderRadius: 'var(--radius-md)', border: '1.5px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                🎫 Ukupno generirano: {codes.length}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  className="btn btn-outline" 
                  onClick={handleCopyUnusedCodes}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  📋 Kopiraj sve slobodne
                </button>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Količina:</span>
                  <input
                    type="number"
                    value={bulkCount}
                    onChange={(e) => setBulkCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="100"
                    style={{ width: 56, padding: '4px 6px', fontSize: '0.82rem', textAlign: 'center', textTransform: 'none', letterSpacing: 'normal' }}
                  />
                </div>

                <button className="btn btn-primary" onClick={() => handleGenerateCodes(bulkCount)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                  <AddIcon style={{ fontSize: 14, marginRight: 2 }} /> Generiraj
                </button>
              </div>
            </div>

            {loadingCodes && codes.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="loading-spinner" />
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-md)' }}>
                <table className="admin-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Kod</th>
                      <th>Status</th>
                      <th>Iskoristio</th>
                      <th>Datum</th>
                      <th style={{ width: 80 }}>Akcije</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{c.code}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(c.code)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'inline-flex', color: 'var(--text-muted)' }}
                              title="Kopiraj kod"
                            >
                              <ContentCopyIcon style={{ fontSize: 12 }} />
                            </button>
                          </div>
                        </td>
                        <td>
                          {c.is_used ? (
                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem' }}>ISKORIŠTEN 🔴</span>
                          ) : (
                            <span style={{ color: 'var(--prisa-teal)', fontWeight: 700, fontSize: '0.75rem' }}>SLOBODAN 🟢</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {c.is_used && c.profiles ? (
                            <div>
                              <div style={{ fontWeight: 700 }}>{c.profiles.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>{c.profiles.email}</div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>
                          {c.is_used && c.used_at ? (
                            new Date(c.used_at).toLocaleString('hr-HR')
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '4px 6px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fee2e2' }}
                            onClick={() => handleDeleteCode(c.id)}
                            disabled={c.is_used}
                            title={c.is_used ? 'Iskorišteni kod se ne može obrisati' : 'Obriši kod'}
                          >
                            <DeleteIcon style={{ fontSize: 12 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {codes.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                          Nema generiranih kodova. Klikni gore za stvoriti prvi kod!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setSelectedAchievementForCodes(null)}>
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
