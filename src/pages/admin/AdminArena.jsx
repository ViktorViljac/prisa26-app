import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { compressImage } from '../../lib/imageCompressor';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function AdminArena() {
  const { profile } = useAuth();
  const [arenaEnabled, setArenaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [categories, setCategories] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [bosses, setBosses] = useState([]);

  const emptyBoss = {
    id: '',
    name: '',
    description: '',
    avatar_url: '',
    max_hp: 5000,
    current_hp: 5000,
    target_all: false,
    target_category_id: '',
    challenge_id: '',
    is_active: false,
    end_date: '',
    death_message: ''
  };

  const [boss, setBoss] = useState(emptyBoss);

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

    // Fetch all bosses
    const { data: bossesData } = await supabase.from('arena_bosses').select('*').order('created_at', { ascending: false });
    if (bossesData) {
      setBosses(bossesData);
    }
    setLoading(false);
  };

  const handleBossImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      let fileToUpload = file;
      try {
        fileToUpload = await compressImage(file, 800, 800, 0.7);
      } catch (compressErr) {
        console.warn('Compression failed, uploading original file:', compressErr);
      }

      const userId = profile?.id || 'admin';
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^/.]+$/, "");
      const filePath = `${userId}/bosses/${Date.now()}_${cleanName}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileToUpload, { upsert: true });

      if (uploadError) {
        alert('Greška pri prijenosu slike Bossa: ' + uploadError.message);
        setUploadingImage(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setBoss(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err) {
      console.error('Boss image upload error:', err);
      alert('Neočekivana greška pri prijenosu slike.');
    } finally {
      setUploadingImage(false);
    }
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
        is_active: boss.is_active,
        end_date: boss.end_date ? new Date(boss.end_date).toISOString() : null,
        death_message: boss.death_message || null
      };

      if (boss.id) {
        await supabase.from('arena_bosses').update(payload).eq('id', boss.id);
      } else {
        await supabase.from('arena_bosses').insert(payload);
      }
      
      // If we saved it as active, deactivate others
      if (boss.is_active) {
        await supabase.rpc('set_active_boss', { p_boss_id: boss.id }); // Works if ID exists, else we just fetch
      }

      alert('Boss uspješno spremljen!');
      setBoss(emptyBoss);
      fetchData();
    } catch (err) {
      alert('Greška pri spremanju bossa');
      console.error(err);
    }
    setSaving(false);
  };

  const handleEditClick = (b) => {
    // format date for datetime-local
    let formattedDate = '';
    if (b.end_date) {
      const d = new Date(b.end_date);
      formattedDate = d.toISOString().slice(0, 16);
    }
    setBoss({
      ...b,
      target_category_id: b.target_category_id || '',
      challenge_id: b.challenge_id || '',
      end_date: formattedDate,
      death_message: b.death_message || ''
    });
  };

  const handleSetActive = async (bossId) => {
    try {
      await supabase.rpc('set_active_boss', { p_boss_id: bossId });
      alert('Aktivni boss promijenjen!');
      fetchData();
    } catch (err) {
      alert('Greška pri postavljanju aktivnog bossa');
      console.error(err);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Jesi li siguran da želiš obrisati bossa: ${b.name}?`)) return;
    try {
      await supabase.from('arena_bosses').delete().eq('id', b.id);
      fetchData();
    } catch (err) {
      alert('Greška pri brisanju bossa.');
      console.error(err);
    }
  };

  if (loading && bosses.length === 0) return <div>Učitavanje...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Postavke Arene i Bosseva</h1>
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

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Side: List of Bosses */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Svi Bossevi</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setBoss(emptyBoss)}>
                <AddIcon style={{ fontSize: 16 }} /> Dodaj
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bosses.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Nema kreiranih bosseva.</div>}
              {bosses.map(b => (
                <div key={b.id} style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12, 
                  background: b.is_active ? 'var(--prisa-orange-light)' : '#f8fafc',
                  border: `1px solid ${b.is_active ? 'var(--prisa-orange)' : '#e2e8f0'}`,
                  borderRadius: 8
                }}>
                  <img src={b.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Boss'} alt="boss" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{b.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      HP: {b.current_hp} / {b.max_hp}
                    </div>
                  </div>
                  
                  {!b.is_active && (
                    <button className="btn btn-outline btn-sm" onClick={() => handleSetActive(b.id)} style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                      Postavi kao Aktivnog
                    </button>
                  )}
                  {b.is_active && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--prisa-orange)', padding: '4px 8px' }}>
                      AKTIVAN
                    </span>
                  )}
                  
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditClick(b)} style={{ padding: '6px' }}>
                    <EditIcon style={{ fontSize: 16 }} />
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDelete(b)} style={{ padding: '6px', color: '#ef4444', borderColor: '#fee2e2' }}>
                    <DeleteIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Boss Form */}
        <div style={{ flex: 1 }}>
          <div className="card" style={{ padding: 24, position: 'sticky', top: 24 }}>
            <h3 style={{ margin: '0 0 16px 0' }}>{boss.id ? `Uredi: ${boss.name}` : 'Kreiraj Novog Bossa'}</h3>
            <form onSubmit={handleSaveBoss} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label>Ime Bossa</label>
                <input type="text" value={boss.name} onChange={e => setBoss({...boss, name: e.target.value})} required />
              </div>

              <div className="form-group">
                <label>Opis (Što Boss radi?)</label>
                <textarea value={boss.description} onChange={e => setBoss({...boss, description: e.target.value})} rows={2} />
              </div>

              <div className="form-group">
                <label>Slika Bossa (Nalijepi URL ili Prenesi sliku s računala/mobitela)</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={boss.avatar_url} 
                    onChange={e => setBoss({...boss, avatar_url: e.target.value})} 
                    placeholder="/images/boss_fire_golem.png ili poslužiteljski URL" 
                    style={{ flex: 1 }}
                  />
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: '8px 12px' }}>
                    {uploadingImage ? <span className="loading-spinner" /> : '🖼️ Prenesi sliku'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBossImageUpload}
                      disabled={uploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                {boss.avatar_url && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <img src={boss.avatar_url} alt="Boss preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600 }}>Pregled odabrane slike</span>
                  </div>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Ugrađene opcije: /images/boss_fire_golem.png, /images/boss_ice_dragon.png, /images/boss_dark_knight.png
                </span>
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

              <div className="form-group">
                <label>Kraj borbe (Vremensko ograničenje)</label>
                <input type="datetime-local" value={boss.end_date} onChange={e => setBoss({...boss, end_date: e.target.value})} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ostaviti prazno ako nema vremenskog ograničenja.</span>
              </div>

              <div className="form-group">
                <label>Poruka kada je Boss pobijeđen (Death Message)</label>
                <textarea value={boss.death_message} onChange={e => setBoss({...boss, death_message: e.target.value})} rows={2} placeholder="Boss pada na koljena i nestaje u oblaku dima..." />
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
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label>Kategorija:</label>
                      <select value={boss.target_category_id} onChange={e => setBoss({...boss, target_category_id: e.target.value, challenge_id: ''})}>
                        <option value="">-- Odaberi --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                      <label>Ili Specifična navika:</label>
                      <select value={boss.challenge_id} onChange={e => setBoss({...boss, challenge_id: e.target.value, target_category_id: ''})}>
                        <option value="">-- Odaberi --</option>
                        {challenges.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={boss.is_active} onChange={e => setBoss({...boss, is_active: e.target.checked})} />
                Zadrži aktivnim (ako snimaš aktivnog)
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Spremanje...' : (boss.id ? 'Spremi Promjene' : 'Kreiraj Bossa')}
                </button>
                {boss.id && (
                  <button type="button" className="btn btn-outline" onClick={() => setBoss(emptyBoss)}>
                    Odustani
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
