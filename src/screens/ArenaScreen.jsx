import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';

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
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

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

  // Timer logic
  useEffect(() => {
    if (!boss || !boss.end_date) {
      setTimeLeft('');
      setIsExpired(false);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(boss.end_date).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft('Vrijeme je isteklo');
        setIsExpired(true);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [boss]);

  const hpPercent = boss ? Math.max(0, Math.min(100, (boss.current_hp / boss.max_hp) * 100)) : 0;
  const isDefeated = boss && boss.current_hp <= 0;

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.4s ease', paddingBottom: 40 }}>
      <div className="hero-card" style={{ padding: '24px 20px', marginBottom: '24px' }}>
        <div className="hero-card-bg" />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
          Arena Boraca ⚔️
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
          Cijela zajednica surađuje! Izvršavaj zadanu naviku i nanosi štetu Bossu prije nego što vrijeme istekne.
        </p>
      </div>

      {!boss ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          Trenutno nema aktivnih Bosseva. Odmori se, ratniče! 🛡️
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* PREMIUM BOSS CARD */}
          <div className="arena-premium-container">
            <div className="arena-premium-glow" />
            
            {/* Victory Overlay */}
            {isDefeated && (
              <div className="arena-victory-overlay">
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏆</div>
                <h2 className="victory-title">Pobjeda!</h2>
                <p className="victory-message">
                  {boss.death_message || "Boss je pao! Zajednica je još jednom trijumfirala nad zlom."}
                </p>
              </div>
            )}

            {/* Time Expired (Defeat) Overlay */}
            {!isDefeated && isExpired && (
              <div className="arena-victory-overlay" style={{ background: 'rgba(40,0,0,0.9)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>💀</div>
                <h2 className="defeat-title">Vrijeme je isteklo</h2>
                <p className="victory-message">
                  Boss je preživio vaš napad i pobjegao. Pokušajte ponovno sljedeći put!
                </p>
              </div>
            )}

            {/* Timer */}
            {boss.end_date && !isDefeated && !isExpired && (
              <div className="arena-timer">
                <AccessTimeIcon fontSize="small" style={{ color: '#fbbf24' }} />
                <span>Preostalo: <span style={{ color: '#fbbf24' }}>{timeLeft}</span></span>
              </div>
            )}

            {/* Boss Image */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              {boss.avatar_url ? (
                <img src={boss.avatar_url} alt="Boss" className="arena-boss-image" />
              ) : (
                <div className="arena-boss-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', background: '#334155' }}>👾</div>
              )}
            </div>

            <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontFamily: 'var(--font-heading)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              {boss.name}
            </h2>
            <p style={{ color: '#cbd5e1', margin: '0 auto 32px auto', fontSize: '1rem', maxWidth: '400px', lineHeight: 1.5 }}>
              {boss.description}
            </p>
            
            {/* HP Bar */}
            <div style={{ marginBottom: 32, padding: '0 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '1rem', fontWeight: 800 }}>
                <span style={{ color: '#f87171', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>HP</span>
                <span style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{boss.current_hp} / {boss.max_hp}</span>
              </div>
              <div className="arena-hp-bar-bg">
                <div className="arena-hp-bar-fill" style={{ width: `${hpPercent}%` }} />
              </div>
            </div>

            {/* Target Info */}
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', display: 'inline-block', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', marginBottom: 8 }}>
                <ErrorOutlineIcon fontSize="small" /> Oružje protiv Bossa
              </div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>
                {boss.target_all 
                  ? "Sve navike!" 
                  : boss.target_category_id 
                    ? `Kategorija: ${tiedCategory || 'Odabrana kategorija'}`
                    : tiedChallenge?.title || "Specifična navika"
                }
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '6px 0 0 0' }}>
                {boss.target_all 
                  ? "Bilo koja dovršena navika nanosi štetu!"
                  : "Dovrši ovu specifičnu naviku kako bi nanio štetu!"
                }
              </p>
            </div>
          </div>

          {/* DAMAGE LOGS */}
          <div className="arena-damage-log">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GroupsIcon sx={{ color: 'var(--prisa-orange)' }} /> Heroji koji napadaju
            </h3>

            {recentDamage.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '30px 0' }}>
                Još nitko nije napao ovog Bossea. Budi prvi i ponesi slavu!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentDamage.map((log) => {
                  const avatarLetter = log.profiles?.name?.charAt(0) || '?';
                  return (
                    <div key={log.user_id} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--prisa-orange-light), var(--prisa-orange))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        {log.profiles?.avatar_url ? <img src={log.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : avatarLetter}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: 800 }}>
                          {formatName(log.profiles?.name)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: 900, fontSize: '1.1rem' }}>
                        <LocalFireDepartmentIcon /> -{log.damage_dealt}
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
