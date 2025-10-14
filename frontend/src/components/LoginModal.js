import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginModal.css';

export default function LoginModal({ open, onClose }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');

  // LOGIN STATE
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // REGISTER STATE
  const [reg, setReg] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [regErr, setRegErr] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode('login');
      setAuthForm({ email: '', password: '' });
      setAuthErr('');
      setReg({ name: '', email: '', password: '', confirmPassword: '' });
      setRegErr('');
      setSuccess('');
    }
  }, [open]);

  const handleBackdrop = (e) => {
    if (e.target.classList.contains('modalBackdrop')) onClose();
  };

  // ✅ Email validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ✅ Password validation rules
  const validatePassword = (password) => {
    const rules = [
      { test: /.{8,}/, message: 'At least 8 characters' },
      { test: /[A-Z]/, message: 'At least one uppercase letter' },
      { test: /[a-z]/, message: 'At least one lowercase letter' },
      { test: /[0-9]/, message: 'At least one number' },
      { test: /[^A-Za-z0-9]/, message: 'At least one special character (!@#$%)' },
    ];
    const failed = rules.filter(r => !r.test.test(password));
    return failed.length ? failed.map(f => f.message).join(', ') : '';
  };

  // LOGIN SUBMIT
  const submitLogin = async (e) => {
    e.preventDefault();
    setAuthErr('');

    // Email format validation
    if (!validateEmail(authForm.email)) {
      setAuthErr('Please enter a valid email address.');
      return;
    }

    // Empty password check
    if (!authForm.password.trim()) {
      setAuthErr('Password cannot be empty.');
      return;
    }

    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/login', authForm);
      if (!data?.token || !data?.user?.role) throw new Error('Invalid login response');
      login({ token: data.token, user: data.user });

      const role = data.user.role;
      const target = role === 'admin' ? '/admin' : role === 'supplier' ? '/supplier' : '/';
      onClose();
      nav(target, { replace: true });
    } catch (err) {
      setAuthErr(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // REGISTER SUBMIT
  const submitRegister = async (e) => {
    e.preventDefault();
    setRegErr('');
    setSuccess('');

    // Email format validation
    if (!validateEmail(reg.email)) {
      setRegErr('Please enter a valid email address.');
      return;
    }

    // Password strength validation
    const passwordError = validatePassword(reg.password);
    if (passwordError) {
      setRegErr(`Password invalid: ${passwordError}`);
      return;
    }

    // Password confirmation
    if (reg.password !== reg.confirmPassword) {
      setRegErr('Passwords do not match.');
      return;
    }

    setRegLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: reg.name,
        email: reg.email,
        password: reg.password
      });

      if (!data?.user && !data?.token) {
        setSuccess('Account created! You can login now.');
        setMode('login');
      } else {
        setSuccess('Account created!');
        if (data?.token) {
          login({ token: data.token, ...data.user });
          onClose();
          nav('/', { replace: true });
        }
      }
      setReg({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setRegErr(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modalBackdrop" onMouseDown={handleBackdrop}>
      <div className="modalCard" role="dialog" aria-modal="true">
        <button className="xBtn" onClick={onClose} aria-label="Close">✕</button>

        <div className="tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => setMode('register')}>Create Customer</button>
        </div>

        {mode === 'login' ? (
          <form className="stack" onSubmit={submitLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </label>
            <label style={{ position: 'relative' }}>
              <span>Password</span>
              <input
                type={showLoginPassword ? 'text' : 'password'}
                value={authForm.password}
                onChange={(e) => setAuthForm(p => ({ ...p, password: e.target.value }))}
                required
              />
              <span
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '38px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  userSelect: 'none'
                }}
              >
                {showLoginPassword ? '🙈' : '👁️'}
              </span>
            </label>
            {authErr && <div className="error">{authErr}</div>}
            <button className="primary" disabled={authLoading}>
              {authLoading ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="muted tiny">Sign in as Customer, Supplier, or Admin. You’ll be redirected to your dashboard.</p>
          </form>
        ) : (
          <form className="stack" onSubmit={submitRegister}>
            <label>
              <span>Name</span>
              <input
                value={reg.name}
                onChange={(e) => setReg(p => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={reg.email}
                onChange={(e) => setReg(p => ({ ...p, email: e.target.value }))}
                required
              />
            </label>

            <label style={{ position: 'relative' }}>
              <span>Password</span>
              <input
                type={showRegPassword ? 'text' : 'password'}
                value={reg.password}
                onChange={(e) => setReg(p => ({ ...p, password: e.target.value }))}
                required
              />
              <span
                onClick={() => setShowRegPassword(!showRegPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '38px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  userSelect: 'none'
                }}
              >
                {showRegPassword ? '🙈' : '👁️'}
              </span>
            </label>

            <label style={{ position: 'relative' }}>
              <span>Confirm Password</span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={reg.confirmPassword}
                onChange={(e) => setReg(p => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '38px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  userSelect: 'none'
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </span>
            </label>

            {regErr && <div className="error">{regErr}</div>}
            {success && <div className="ok">{success}</div>}
            <button className="primary" disabled={regLoading}>
              {regLoading ? 'Creating…' : 'Create Account'}
            </button>
            <p className="muted tiny">Password must include uppercase, lowercase, number, and special character.</p>
          </form>
        )}
      </div>
    </div>
  );
}
