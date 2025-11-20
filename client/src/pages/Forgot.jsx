import { useState } from 'react';
import api from '../lib/api';
import { Card, Button, Input } from '../components/UI.jsx';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showSug, setShowSug] = useState(false);

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

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setPreviewUrl('');
    try {
      const { data } = await api.post('/api/auth/forgot', { email });
      setMsg('If an account exists, a reset link has been sent.');
      addToHistory('emailHistory', email);
      if (data?.previewUrl) setPreviewUrl(data.previewUrl);
    } catch (_) {
      setMsg('If an account exists, a reset link has been sent.');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Forgot Password</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Enter your email to receive a reset link.</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e)=>{ setEmail(e.target.value); setShowSug(true); }}
              onFocus={()=> setShowSug(true)}
              onBlur={()=> setTimeout(()=> setShowSug(false), 120)}
              autoComplete="off"
            />
            {showSug && (getHistory('emailHistory').filter(v => !email || v.toLowerCase().includes(email.toLowerCase())).length > 0) && (
              <div className="absolute left-0 right-0 mt-1 rounded-md border text-sm max-h-40 overflow-auto" style={{ background: 'var(--surface)', borderColor: 'rgba(0,0,0,0.12)', zIndex: 20 }}>
                {getHistory('emailHistory')
                  .filter(v => !email || v.toLowerCase().includes(email.toLowerCase()))
                  .map((v) => (
                    <div key={v} className="px-3 py-2 cursor-pointer hover:bg-black/5" onMouseDown={(e)=>{ e.preventDefault(); setEmail(v); setShowSug(false); }}>
                      {v}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <Button className="w-full">Send reset link</Button>
        </form>
        {msg && <div className="text-sm" style={{ color: 'var(--muted)' }}>{msg}</div>}
        {previewUrl && (
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            Preview email: <a href={previewUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{previewUrl}</a>
          </div>
        )}
      </Card>
    </div>
  );
}
