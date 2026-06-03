import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const today = new Date();
  const dateStr = today.toLocaleDateString('hr-HR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Ispuni sva polja.');
      return;
    }
    if (mode === 'register' && !name) {
      setError('Upiši svoje ime.');
      return;
    }
    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 znakova.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (err) {
      if (err.message?.includes('Invalid login')) {
        setError('Pogrešan email ili lozinka.');
      } else if (err.message?.includes('already registered')) {
        setError('Ovaj email je već registriran.');
      } else if (err.message?.includes('Password')) {
        setError('Lozinka mora imati najmanje 6 znakova.');
      } else {
        setError(err.message || 'Došlo je do greške. Pokušaj ponovo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="notebook-bg" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <img
            src="/-prisa-icon.png"
            alt="Priša logo"
            style={{
              width: 80,
              height: 80,
              objectFit: 'contain',
              marginBottom: 12,
            }}
          />
          <div className="login-logo-title">PRIŠA</div>
          <div className="login-logo-sub">Ljeto koje mijenja navike ✨</div>
          <div className="login-date-badge">
            📅 {dateStr}
          </div>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
            type="button"
          >
            Prijava
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
            type="button"
          >
            Registracija
          </button>
        </div>

        {/* Error */}
        {error && <div className="login-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="login-name">Ime i prezime</label>
              <input
                id="login-name"
                type="text"
                placeholder="Marko Markić"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="marko@primjer.hr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Lozinka</label>
            <div className="input-password-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-large"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : mode === 'login' ? 'Prijavi se' : 'Registriraj se'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="login-forgot">
            <a href="#" onClick={(e) => e.preventDefault()}>Zaboravljena lozinka?</a>
          </div>
        )}
      </div>
    </div>
  );
}
