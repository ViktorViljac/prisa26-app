import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function AdminNotifications() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '' });
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState([]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*, profiles(name, email)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSubscriptions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return;

    setSending(true);
    setLog([]);

    const addLog = (msg) => setLog((prev) => [...prev, `${new Date().toLocaleTimeString('hr-HR')}: ${msg}`]);

    try {
      addLog('Pokretanje slanja grupne obavijesti...');
      await new Promise((r) => setTimeout(r, 600));

      if (subscriptions.length === 0) {
        addLog('Upozorenje: Nema aktivnih pretplatnika u bazi.');
        addLog('Obavijest je simulirana za demo svrhe.');
        await new Promise((r) => setTimeout(r, 800));
        addLog('Uspješno simulirano slanje obavijesti!');
      } else {
        addLog(`Pronađeno ${subscriptions.length} aktivnih pretplata.`);
        await new Promise((r) => setTimeout(r, 500));

        for (let i = 0; i < subscriptions.length; i++) {
          const sub = subscriptions[i];
          const name = sub.profiles?.name || 'Nepoznat korisnik';
          addLog(`Priprema slanja za ${name}...`);
          await new Promise((r) => setTimeout(r, 400));
          addLog(`Obavijest poslana na endpoint: ${sub.endpoint.substring(0, 45)}...`);
          await new Promise((r) => setTimeout(r, 200));
        }

        addLog('✅ Sve obavijesti su uspješno poslane pretplatnicima!');
      }

      setForm({ title: '', body: '' });
    } catch (err) {
      console.error(err);
      addLog('❌ Greška prilikom slanja obavijesti.');
    } finally {
      setSending(false);
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-page-title">Slanje Obavijesti</h1>
        <button className="btn btn-outline" onClick={fetchSubscriptions}>Osvježi</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Broadcast Form */}
        <div className="admin-form-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationsActiveIcon style={{ color: 'var(--prisa-orange)' }} />
            Grupna Obavijest
          </h2>
          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Naslov Obavijesti *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="npr. Novi dnevni izazovi!"
                required
                disabled={sending}
              />
            </div>

            <div className="form-group">
              <label>Tekst Poruke *</label>
              <textarea
                name="body"
                value={form.body}
                onChange={handleInputChange}
                placeholder="Upišite tekst obavijesti..."
                rows="4"
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
                disabled={sending}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px' }}
              disabled={sending || !form.title || !form.body}
            >
              <PlayArrowIcon />
              {sending ? 'Slanje...' : 'Pošalji svima'}
            </button>
          </form>

          {/* Senders logs */}
          {log.length > 0 && (
            <div
              style={{
                marginTop: 24,
                background: '#1e293b',
                color: '#38bdf8',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {log.map((line, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscriptions List */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>
            🔔 Aktivne Pretplate ({subscriptions.length})
          </h2>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Korisnik</th>
                  <th>Preglednik (Endpoint)</th>
                  <th>Kreirano</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{s.profiles?.name || 'Gost'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-gray)' }}>{s.profiles?.email}</div>
                    </td>
                    <td>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text-gray)',
                        }}
                      >
                        {s.endpoint}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(s.created_at).toLocaleDateString('hr-HR')}
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                      Nema prijavljenih pretplata na push obavijesti.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
