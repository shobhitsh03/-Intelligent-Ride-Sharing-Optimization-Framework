import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Card, Button, Input, Alert } from '../components/UI.jsx';

export default function Reset() {
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token') || '';
    setToken(t);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    if (!token) {
      setError('Invalid or missing token');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      await api.post('/api/auth/reset', { token, password });
      setMsg('Password reset successful. Redirecting to login...');
      setTimeout(() => nav('/login'), 1200);
    } catch (e) {
      setError(e?.response?.data?.error || 'Reset failed');
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6 space-y-3">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Reset Password</h2>
        {msg && <Alert type="success">{msg}</Alert>}
        {error && <Alert type="error">{error}</Alert>}
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="New password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <Input placeholder="Confirm password" type="password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
          <Button className="w-full">Reset Password</Button>
        </form>
      </Card>
    </div>
  );
}
