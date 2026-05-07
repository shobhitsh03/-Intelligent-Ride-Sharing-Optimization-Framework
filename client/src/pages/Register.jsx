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
      // For radio buttons, always set to the selected role only
      return { ...f, roles: [role] };
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
    if (!Array.isArray(form.roles) || form.roles.length === 0) { setError('Please select a role'); return false; }
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
    <>
      <div className="bg-animation" />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">
              <span style={{ color: 'var(--brand)' }}>Ride</span>
              <span style={{ color: '#D97706' }}>Flex</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Join the future of smart mobility
            </p>
          </div>
          
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text)' }}>
            Create Account
          </h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium text-center" 
                 style={{ 
                   background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                   color: '#FFFFFF',
                   border: '1px solid rgba(255,255,255,0.2)'
                 }}>
              {error}
            </div>
          )}
          
          <form onSubmit={onSubmit} className="space-y-4">
            <Input 
              placeholder="Full Name" 
              value={form.name} 
              onChange={(e)=>set('name', e.target.value)} 
              className="w-full"
            />
            
            <div className="relative">
              <Input
                placeholder="Email Address"
                value={form.email}
                onChange={(e)=>{ set('email', e.target.value); setShowEmailSug(true); }}
                onFocus={()=> setShowEmailSug(true)}
                onBlur={()=> setTimeout(()=> setShowEmailSug(false), 120)}
                autoComplete="off"
                className="w-full"
              />
              {showEmailSug && (getHistory('emailHistory').filter(v => !form.email || v.toLowerCase().includes(form.email.toLowerCase())).length > 0) && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border text-sm max-h-40 overflow-auto glass-card z-20"
                     style={{ 
                       top: '100%'
                     }}>
                  {getHistory('emailHistory')
                    .filter(v => !form.email || v.toLowerCase().includes(form.email.toLowerCase()))
                    .map((v) => (
                      <div key={v} 
                           className="px-3 py-2 cursor-pointer transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                           onMouseDown={(e)=>{ e.preventDefault(); set('email', v); setShowEmailSug(false); }}
                           style={{ color: 'var(--text)' }}>
                        {v}
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <Input 
              placeholder="Password" 
              type="password" 
              value={form.password} 
              onChange={(e)=>set('password', e.target.value)} 
              className="w-full"
            />
            
            <div className="relative">
              <Input
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e)=>{ set('phone', e.target.value); setShowPhoneSug(true); }}
                onFocus={()=> setShowPhoneSug(true)}
                onBlur={()=> setTimeout(()=> setShowPhoneSug(false), 120)}
                autoComplete="off"
                className="w-full"
              />
              {showPhoneSug && (getHistory('phoneHistory').filter(v => !form.phone || v.includes(form.phone)).length > 0) && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border text-sm max-h-40 overflow-auto glass-card z-20"
                     style={{ 
                       top: '100%'
                     }}>
                  {getHistory('phoneHistory')
                    .filter(v => !form.phone || v.includes(form.phone))
                    .map((v) => (
                      <div key={v} 
                           className="px-3 py-2 cursor-pointer transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                           onMouseDown={(e)=>{ e.preventDefault(); set('phone', v); setShowPhoneSug(false); }}
                           style={{ color: 'var(--text)' }}>
                        {v}
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>I want to:</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="role"
                    checked={Array.isArray(form.roles) && form.roles.includes('rider')}
                    onChange={() => toggleRole('rider')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    style={{ 
                      accentColor: 'var(--brand)'
                    }}
                  />
                  <span className="text-sm font-medium group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text)' }}>
                    🚗 Ride as Passenger
                  </span>
                </label>
                <label className="inline-flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="role"
                    checked={Array.isArray(form.roles) && form.roles.includes('driver')}
                    onChange={() => toggleRole('driver')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    style={{ 
                      accentColor: 'var(--brand)'
                    }}
                  />
                  <span className="text-sm font-medium group-hover:text-indigo-400 transition-colors" style={{ color: 'var(--text)' }}>
                    🚙 Offer Rides
                  </span>
                </label>
              </div>
            </div>
            
            <Button className="w-full text-base py-3 mt-6">Create Account</Button>
          </form>
          
          <div className="text-center mt-6 pt-6 border-t" 
               style={{ borderColor: 'var(--glass-border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Already have an account? 
              <Link to="/login" className="ml-1 font-semibold hover:text-indigo-400 transition-colors" style={{ color: 'var(--brand)' }}>
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
