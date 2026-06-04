import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';

const formatName = (name) => {
  if (!name) return 'Korisnik';
  if (name.includes('.')) {
    return name.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }
  return name;
};

export default function ArenaScreen() {
  const { profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [boss, setBoss] = useState(null);
  const [tiedChallenge, setTiedChallenge] = useState(null);
  const [tiedCategory, setTiedCategory] = useState(null);
  const [recentDamage, setRecentDamage] = useState([]);

  const fetchData = async () => {
    if (!profile) return;
    
    // Fetch active boss
    const { data: bosses } = await supabase
      .from('arena_bosses')
      .select('*, challenges(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (bosses && bosses.length > 0) {
      const activeBoss = bosses[0];
      setBoss(activeBoss);
      setTiedChallenge(activeBoss.challenges);

      if (activeBoss.target_category_id) {
        const { data: cat } = await supabase.from('challenge_categories').select('name').eq('id', activeBoss.target_category_id).single();
        if (cat) setTiedCategory(cat.name);
      } else {
        setTiedCategory(null);
      }

      // Fetch recent damage dealt to this boss
      const { data: damageLogs } = await supabase
        .from('arena_boss_damage')
        .select('*, profiles(name, avatar_url)')
        .eq('boss_id', bosses[0].id)
        .order('last_damage_at', { ascending: false })
        .limit(10);
      
      if (damageLogs) {
        setRecentDamage(damageLogs);
      }
    } else {
      setBoss(null);
      setTiedChallenge(null);
      setRecentDamage([]);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchData();

    const randomSuffix = Math.random().toString(36).slice(2, 11);
    const channelId = `boss-changes-${randomSuffix}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'arena_bosses' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const hpPercent = boss ? Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100)) : 0;

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease' }}>
      <div className="hero-card" style={{ padding: '24px 20px', marginBottom: '24px' }}>
        <div className="hero-card-bg" />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
          Epic Boss Fight ⚔️
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Cijela zajednica surađuje! Rješavaj zadanu naviku i nanosi štetu Bossu.
        </p>
      </div>

      {!boss ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          Trenutno nema aktivnih Bosseva. Odmori se, ratniče! 🛡️
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* BOSS CARD */}
          <div className="card" style={{ padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {boss.current_hp <= 0 && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
                  <h2 style={{ margin: 0, color: 'var(--prisa-orange)' }}>Boss je poražen!</h2>
                  <p style={{ margin: 0, color: 'var(--text-gray)' }}>Zajednica je pobijedila.</p>
                </div>
              </div>
            )}
            
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>
              {boss.avatar_url ? <img src={boss.avatar_url} alt="Boss" style={{ width: 100, height: 100, borderRadius: '50%' }} /> : '👾'}
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', fontFamily: 'var(--font-heading)' }}>{boss.name}</h2>
            <p style={{ color: 'var(--text-gray)', margin: '0 0 24px 0', fontSize: '0.9rem' }}>{boss.description}</p>
            
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--prisa-orange)' }}>HP</span>
                <span style={{ color: 'var(--text-dark)' }}>{boss.current_hp} / {boss.max_hp}</span>
              </div>
              <div style={{ width: '100%', height: 24, background: '#f0ebe6', borderRadius: 12, overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ 
                  width: `${hpPercent}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #ef4444, #fb923c)', 
                  transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' 
                }} />
              </div>
            </div>

            <div style={{ background: 'var(--prisa-orange-light)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--prisa-orange)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--prisa-orange)', textTransform: 'uppercase', marginBottom: 4 }}>
                🎯 Oružje protiv Bossa:
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                {boss.target_all 
                  ? "Sve navike!" 
                  : boss.target_category_id 
                    ? `Sve navike iz kategorije: ${tiedCategory || 'Odabrana kategorija'}`
                    : tiedChallenge?.title || "Specifična navika"
                }
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {boss.target_all 
                  ? "Svaki put kada zabilježiš bilo koju naviku, Boss gubi HP!"
                  : "Svaki put kada zabilježiš ovu naviku u Izazovima, Boss gubi HP!"
                }
              </p>
            </div>
          </div>

          {/* DAMAGE LOGS */}
          <div className="card" style={{ padding: '24px 20px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GroupsIcon sx={{ color: 'var(--prisa-orange)' }} /> Heroji koji napadaju
            </h3>

            {recentDamage.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                Još nitko nije napao Bossea. Budi prvi!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentDamage.map((log) => {
                  const avatarLetter = log.profiles?.name?.charAt(0) || '?';
                  return (
                    <div key={log.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#fafafa', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--prisa-orange-light)', color: 'var(--prisa-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, overflow: 'hidden' }}>
                        {log.profiles?.avatar_url ? <img src={log.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 800 }}>
                          {formatName(log.profiles?.name)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--prisa-orange)', fontWeight: 800, fontSize: '0.9rem' }}>
                        <LocalFireDepartmentIcon fontSize="small" /> -{log.damage_dealt} HP
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
