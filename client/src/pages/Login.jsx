import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Input } from '../components/UI.jsx';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  function getHistory(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  function addToHistory(key, value) {
    if (!value) return;
    const list = getHistory(key);
    if (!list.includes(value)) {
      list.unshift(value);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 8)));
    }
  }

  function validate() {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) { setError('Enter a valid email'); return false; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      if (!data || !data.token) {
        throw new Error('Invalid credentials');
      }
      localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      addToHistory('emailHistory', email);
      window.dispatchEvent(new Event('auth-token-changed'));
      nav('/dashboard');
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Login</h2>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Email"
              type="email"
              required
              value={email}
              onChange={(e)=>{ setEmail(e.target.value); setShowEmailSuggestions(true); }}
              onFocus={()=> setShowEmailSuggestions(true)}
              onBlur={()=> setTimeout(()=> setShowEmailSuggestions(false), 120)}
              autoComplete="off"
            />
            {showEmailSuggestions && (getHistory('emailHistory').filter(v => !email || v.toLowerCase().includes(email.toLowerCase())).length > 0) && (
              <div className="absolute left-0 right-0 mt-1 rounded-md border text-sm max-h-40 overflow-auto"
                   style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.12)', zIndex: 20 }}>
                {getHistory('emailHistory')
                  .filter(v => !email || v.toLowerCase().includes(email.toLowerCase()))
                  .map((v) => (
                    <div key={v}
                         className="px-3 py-2 cursor-pointer hover:bg-black/5"
                         onMouseDown={(e)=>{ e.preventDefault(); setEmail(v); setShowEmailSuggestions(false); }}>
                      {v}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <Input placeholder="Password" type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} />
          <Button className="w-full">Login</Button>
        </form>
        <div className="text-sm mt-3 flex justify-between" style={{ color: 'var(--muted)' }}>
          <span>No account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register</Link></span>
          <Link to="/forgot" style={{ color: 'var(--primary)' }}>Forgot password?</Link>
        </div>
      </Card>
    </div>
  );
}
