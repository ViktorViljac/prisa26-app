import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminArena() {
  const [arenaEnabled, setArenaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [challenges, setChallenges] = useState([]);

  const [boss, setBoss] = useState({
    id: '',
    name: '',
    description: '',
    avatar_url: '',
    max_hp: 5000,
    current_hp: 5000,
    target_all: false,
    target_category_id: '',
    challenge_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch global setting
    const { data: settingData } = await supabase.from('app_settings').select('*').eq('key', 'arena_enabled').single();
    if (settingData && settingData.value) {
      setArenaEnabled(settingData.value.enabled === true || settingData.value === true);
    }

    // Fetch lists
    const { data: cats } = await supabase.from('challenge_categories').select('id, name').order('name');
    if (cats) setCategories(cats);
    const { data: chals } = await supabase.from('challenges').select('id, title').order('title');
    if (chals) setChallenges(chals);

    // Fetch active boss
    const { data: bosses } = await supabase.from('arena_bosses').select('*').eq('is_active', true).limit(1);
    if (bosses && bosses.length > 0) {
      setBoss({
        ...bosses[0],
        target_category_id: bosses[0].target_category_id || '',
        challenge_id: bosses[0].challenge_id || ''
      });
    }
    setLoading(false);
  };

  const handleToggleArena = async () => {
    const newVal = !arenaEnabled;
    setArenaEnabled(newVal);
    
    // Check if row exists
    const { data } = await supabase.from('app_settings').select('key').eq('key', 'arena_enabled').single();
    if (data) {
      await supabase.from('app_settings').update({ value: newVal }).eq('key', 'arena_enabled');
    } else {
      await supabase.from('app_settings').insert({ key: 'arena_enabled', value: newVal });
    }
    alert(`Arena je sada ${newVal ? 'uključena' : 'isključena'}`);
  };

  const handleSaveBoss = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: boss.name,
        description: boss.description,
        avatar_url: boss.avatar_url,
        max_hp: parseInt(boss.max_hp),
        current_hp: parseInt(boss.current_hp),
        target_all: boss.target_all,
        target_category_id: boss.target_category_id || null,
        challenge_id: boss.challenge_id || null,
        is_active: boss.is_active
      };

      if (boss.id) {
        await supabase.from('arena_bosses').update(payload).eq('id', boss.id);
      } else {
        await supabase.from('arena_bosses').insert(payload);
      }
      alert('Boss uspješno spremljen!');
      fetchData();
    } catch (err) {
      alert('Greška pri spremanju bossa');
      console.error(err);
    }
    setSaving(false);
  };

  if (loading) return <div>Učitavanje...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Postavke Arene i Bossa</h1>
        <p>Upravljajte Boss borbama i vidljivošću Arene za sve korisnike</p>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: '0 0 8px 0' }}>Globalna vidljivost Arene</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Kada je isključeno, korisnici uopće neće vidjeti opciju "Arena" u izborniku.
          </p>
        </div>
        <button 
          className={`btn ${arenaEnabled ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleToggleArena}
        >
          {arenaEnabled ? 'Isključi Arenu' : 'Uključi Arenu'}
        </button>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>{boss.id ? 'Uredi Aktivnog Bossa' : 'Kreiraj Novog Bossa'}</h3>
        <form onSubmit={handleSaveBoss} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label>Ime Bossa</label>
            <input type="text" value={boss.name} onChange={e => setBoss({...boss, name: e.target.value})} required />
          </div>

          <div className="form-group">
            <label>Opis (Što Boss radi?)</label>
            <textarea value={boss.description} onChange={e => setBoss({...boss, description: e.target.value})} rows={3} />
          </div>

          <div className="form-group">
            <label>Avatar URL (Poveznica na sliku)</label>
            <input type="url" value={boss.avatar_url} onChange={e => setBoss({...boss, avatar_url: e.target.value})} placeholder="https://api.dicebear.com/7.x/bottts/svg?seed=Boss" />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Maksimalni HP</label>
              <input type="number" value={boss.max_hp} onChange={e => setBoss({...boss, max_hp: e.target.value})} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Trenutni HP</label>
              <input type="number" value={boss.current_hp} onChange={e => setBoss({...boss, current_hp: e.target.value})} required />
            </div>
          </div>

          <div className="form-group" style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-dark)' }}>Što nanosi štetu ovom Bossu?</h4>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input 
                type="checkbox" 
                checked={boss.target_all} 
                onChange={e => setBoss({...boss, target_all: e.target.checked})} 
              />
              Sve navike (Bilo koja dovršena navika nanosi štetu)
            </label>

            {!boss.target_all && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Ili specifična kategorija:</label>
                  <select 
                    value={boss.target_category_id} 
                    onChange={e => setBoss({...boss, target_category_id: e.target.value, challenge_id: ''})}
                  >
                    <option value="">-- Odaberi kategoriju --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Ili specifična navika:</label>
                  <select 
                    value={boss.challenge_id} 
                    onChange={e => setBoss({...boss, challenge_id: e.target.value, target_category_id: ''})}
                  >
                    <option value="">-- Odaberi naviku --</option>
                    {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={boss.is_active} onChange={e => setBoss({...boss, is_active: e.target.checked})} />
            Boss je trenutno aktivan
          </label>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 16 }}>
            {saving ? 'Spremanje...' : 'Spremi Bossa'}
          </button>
        </form>
      </div>
    </div>
  );
}
