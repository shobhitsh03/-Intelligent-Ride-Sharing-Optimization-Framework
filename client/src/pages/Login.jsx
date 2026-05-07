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
              Welcome to the future of smart mobility
            </p>
          </div>
          
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text)' }}>
            Sign In
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
            <div className="relative">
              <Input
                placeholder="Email Address"
                type="email"
                required
                value={email}
                onChange={(e)=>{ setEmail(e.target.value); setShowEmailSuggestions(true); }}
                onFocus={()=> setShowEmailSuggestions(true)}
                onBlur={()=> setTimeout(()=> setShowEmailSuggestions(false), 120)}
                autoComplete="off"
                className="w-full"
              />
              {showEmailSuggestions && (getHistory('emailHistory').filter(v => !email || v.toLowerCase().includes(email.toLowerCase())).length > 0) && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border text-sm max-h-40 overflow-auto glass-card z-20"
                     style={{ 
                       top: '100%'
                     }}>
                  {getHistory('emailHistory')
                    .filter(v => !email || v.toLowerCase().includes(email.toLowerCase()))
                    .map((v) => (
                      <div key={v}
                           className="px-3 py-2 cursor-pointer transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700"
                           onMouseDown={(e)=>{ e.preventDefault(); setEmail(v); setShowEmailSuggestions(false); }}
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
              required 
              minLength={6} 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              className="w-full"
            />
            
            <Button className="w-full text-base py-3">Sign In</Button>
          </form>
          
          <div className="text-center mt-6 pt-6 border-t space-y-2" 
               style={{ borderColor: 'var(--glass-border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Don't have an account? 
              <Link to="/register" className="ml-1 font-semibold hover:text-indigo-400 transition-colors" style={{ color: 'var(--brand)' }}>
                Sign Up
              </Link>
            </p>
            <Link to="/forgot" className="text-sm font-medium hover:text-indigo-400 transition-colors block" style={{ color: 'var(--brand)' }}>
              Forgot your password?
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
