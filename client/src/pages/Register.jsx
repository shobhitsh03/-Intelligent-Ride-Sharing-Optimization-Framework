import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Input } from '../components/UI.jsx';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', roles: ['rider'], phone: '' });
  const [error, setError] = useState('');
  const [showEmailSug, setShowEmailSug] = useState(false);
  const [showPhoneSug, setShowPhoneSug] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function toggleRole(role) {
    setForm((f) => {
      const has = Array.isArray(f.roles) && f.roles.includes(role);
      const nextRoles = has ? f.roles.filter(r => r !== role) : [...(f.roles || []), role];
      return { ...f, roles: nextRoles };
    });
  }

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
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailOk) { setError('Enter a valid email'); return false; }
    if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
    if (form.phone) {
      const digits = (form.phone || '').replace(/[^0-9]/g, '');
      if (digits.length < 7 || digits.length > 15) { setError('Enter a valid phone number'); return false; }
    }
    if (!Array.isArray(form.roles) || form.roles.length === 0) { setError('Select at least one role'); return false; }
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (!validate()) return;
      // Attach geolocation if available
      let location;
      if (navigator.geolocation) {
        await new Promise((resolve) => navigator.geolocation.getCurrentPosition((pos) => {
          location = { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] };
          resolve();
        }, () => resolve()));
      }
      const { data } = await api.post('/api/auth/register', { ...form, location });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      addToHistory('emailHistory', form.email);
      addToHistory('phoneHistory', form.phone);
      window.dispatchEvent(new Event('auth-token-changed'));
      nav('/dashboard');
    } catch (e) {
      setError(e?.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Register</h2>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(e)=>set('name', e.target.value)} />
          <div className="relative">
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e)=>{ set('email', e.target.value); setShowEmailSug(true); }}
              onFocus={()=> setShowEmailSug(true)}
              onBlur={()=> setTimeout(()=> setShowEmailSug(false), 120)}
              autoComplete="off"
            />
            {showEmailSug && (getHistory('emailHistory').filter(v => !form.email || v.toLowerCase().includes(form.email.toLowerCase())).length > 0) && (
              <div className="absolute left-0 right-0 mt-1 rounded-md border text-sm max-h-40 overflow-auto" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.12)', zIndex: 20 }}>
                {getHistory('emailHistory')
                  .filter(v => !form.email || v.toLowerCase().includes(form.email.toLowerCase()))
                  .map((v) => (
                    <div key={v} className="px-3 py-2 cursor-pointer hover:bg-black/5" onMouseDown={(e)=>{ e.preventDefault(); set('email', v); setShowEmailSug(false); }}>
                      {v}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <Input placeholder="Password" type="password" value={form.password} onChange={(e)=>set('password', e.target.value)} />
          <div className="relative">
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e)=>{ set('phone', e.target.value); setShowPhoneSug(true); }}
              onFocus={()=> setShowPhoneSug(true)}
              onBlur={()=> setTimeout(()=> setShowPhoneSug(false), 120)}
              autoComplete="off"
            />
            {showPhoneSug && (getHistory('phoneHistory').filter(v => !form.phone || v.includes(form.phone)).length > 0) && (
              <div className="absolute left-0 right-0 mt-1 rounded-md border text-sm max-h-40 overflow-auto" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.12)', zIndex: 20 }}>
                {getHistory('phoneHistory')
                  .filter(v => !form.phone || v.includes(form.phone))
                  .map((v) => (
                    <div key={v} className="px-3 py-2 cursor-pointer hover:bg-black/5" onMouseDown={(e)=>{ e.preventDefault(); set('phone', v); setShowPhoneSug(false); }}>
                      {v}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text)' }}>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Array.isArray(form.roles) && form.roles.includes('rider')}
                onChange={() => toggleRole('rider')}
              />
              Rider
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={Array.isArray(form.roles) && form.roles.includes('driver')}
                onChange={() => toggleRole('driver')}
              />
              Driver
            </label>
          </div>
          <Button className="w-full">Register</Button>
        </form>
        <div className="text-sm mt-3" style={{ color: 'var(--muted)' }}>Have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link></div>
      </Card>
    </div>
  );
}
