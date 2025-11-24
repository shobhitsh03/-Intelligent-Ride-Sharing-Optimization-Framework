import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './index.css';
import 'leaflet/dist/leaflet.css';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateRide from './pages/CreateRide.jsx';
import FindRide from './pages/FindRide.jsx';
import Track from './pages/Track.jsx';
import Payment from './pages/Payment.jsx';
import Forgot from './pages/Forgot.jsx';
import Reset from './pages/Reset.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';
import RideBookings from './pages/RideBookings.jsx';
import Debug from './pages/Debug.jsx';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Car, Search, UserPlus, LogIn, LogOut, Menu as MenuIcon, Sun, Moon, DashboardIcon } from './components/Icons.jsx';
import { motion } from 'framer-motion';
import Footer from './components/Footer.jsx';

function App() {
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => (typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false));
  const [logoutBlink, setLogoutBlink] = useState(false);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  function toggleDark() {
    const root = document.documentElement;
    const next = root.classList.toggle('dark');
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  // Initialize theme from storage
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'token') setToken(e.newValue);
    }
    window.addEventListener('storage', onStorage);
    function onAuthTokenChanged() {
      const t = localStorage.getItem('token');
      setToken(t);
    }
    window.addEventListener('auth-token-changed', onAuthTokenChanged);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Socket.IO: join user room and receive booking updates/requests
  useEffect(() => {
    const user = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null);
    if (!token || !user?._id) {
      if (socketRef.current) { try { socketRef.current.disconnect(); } catch {} socketRef.current = null; }
      return;
    }
    const url = import.meta.env.VITE_SERVER_URL;
    const socket = io(url, { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join:user', { userId: user._id });

    const pushToast = (type, message) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5500);
    };

    socket.on('booking:update', ({ status, bookingId, rideId }) => {
      if (status === 'accepted') pushToast('success', 'Driver accepted your booking.');
      else if (status === 'declined') pushToast('error', 'Driver declined your booking.');
      else pushToast('info', 'Booking updated.');
    });

    socket.on('booking:request', ({ bookingId, rideId, seats, amount }) => {
      // For drivers logged in
      pushToast('info', `New booking request: ${seats} seat(s), ₹${amount}.`);
      try {
        const key = 'notifications';
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const item = { id: bookingId, type: 'request', rideId, seats, amount, ts: Date.now() };
        const next = [item, ...arr].slice(0, 20);
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event('notifications-updated'));
      } catch {}
    });

    return () => {
      try { socket.emit('leave:user', { userId: user._id }); } catch {}
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const onAppToast = (e) => {
      const { type = 'info', message = '' } = e.detail || {};
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
    };
    window.addEventListener('app-toast', onAppToast);
    return () => window.removeEventListener('app-toast', onAppToast);
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    navigate('/');
  }

  return (
    <div className="min-h-screen">
        <nav className="border-b sticky top-0 z-10" style={{ background: 'rgba(17,17,17,0.9)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="max-w-6xl mx-auto px-4 md:px-5 py-2 md:py-3 flex flex-wrap gap-3 md:gap-6 items-center">
            <Link to="/" className="font-semibold tracking-tight flex items-center gap-2" style={{ color: '#f5f5f5' }}>
              <Car size={18} /> Carpool
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <button aria-label="Toggle menu" aria-expanded={mobileOpen} onClick={()=>setMobileOpen(o=>!o)} className="md:hidden rounded px-2 py-1 text-sm border" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }}>
                <MenuIcon size={18} />
              </button>
            </div>
            <div className={`${mobileOpen ? 'flex' : 'hidden'} w-full flex-col gap-2 pt-2 md:pt-0 md:w-auto md:flex md:flex-row md:items-center md:gap-6 md:ml-6`}> 
              {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); return (
                <>
                  {roles.includes('rider') && (
                    <>
                      <Link to="/find-ride" className="text-sm flex items-center gap-1 rounded-md px-3 py-1.5 shadow w-full md:w-auto active:scale-95 transition" style={{ background: 'var(--accent)', color: '#111' }} onClick={()=>setMobileOpen(false)}>
                        <Search size={16} /> Find Ride
                      </Link>
                    </>
                  )}
                  {roles.includes('driver') && (
                    <>
                      <Link to="/create-ride" className="text-sm flex items-center gap-1 rounded-md px-3 py-1.5 border w-full md:w-auto active:scale-95 transition" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }} onClick={()=>setMobileOpen(false)}>
                        <UserPlus size={16} /> Create Ride
                      </Link>
                      <Link to="/driver-dashboard" className="text-sm flex items-center gap-1 rounded-md px-3 py-1.5 border w-full md:w-auto active:scale-95 transition" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }} onClick={()=>setMobileOpen(false)}>
                        <DashboardIcon size={16} /> Driver Dashboard
                      </Link>
                    </>
                  )}
                </>
              ); })()}
              
              {!token ? (
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
                  <Link to="/login" className="text-sm flex items-center gap-1 rounded-md px-3 py-1.5 border w-full md:w-auto active:scale-95 transition" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }} onClick={()=>setMobileOpen(false)}><LogIn size={16}/> Login</Link>
                  <Link to="/register" className="text-sm flex items-center gap-1 rounded-md px-3 py-1.5 w-full md:w-auto active:scale-95 transition" style={{ background: 'var(--accent)', color: '#111' }} onClick={()=>setMobileOpen(false)}><UserPlus size={16}/> Register</Link>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 md:ml-auto w-full md:w-auto">
                  {(() => { const u = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null); const roles = Array.isArray(u?.roles) ? u.roles : (u?.role ? [u.role] : []); const label = roles.includes('driver') && roles.includes('rider') ? 'Driver & Rider' : roles.includes('driver') ? 'Driver' : roles.includes('rider') ? 'Rider' : 'User'; return (
                    <span className="block w-full text-center md:w-auto text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }}>Logged in as {label}</span>
                  ); })()}
                  <button
                    onClick={()=>{
                      setLogoutBlink(true);
                      setTimeout(()=>{ setLogoutBlink(false); logout(); setMobileOpen(false); }, 180);
                    }}
                    className={`rounded-full p-2 border flex items-center justify-center w-full md:w-auto transition active:scale-95 ${logoutBlink ? 'animate-pulse' : ''} hover:bg-white/10`}
                    style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }}
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut size={16}/>
                  </button>
                  <Link to="/dashboard" aria-label="Dashboard" className="rounded-full p-2 border flex items-center justify-center w-full md:w-auto hover:bg-white/10 active:scale-95 transition" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#a3a3a3' }} onClick={()=>setMobileOpen(false)}>
                    <DashboardIcon size={16} />
                  </Link>
                  <button onClick={toggleDark} className="rounded px-2 py-1 text-xs border flex items-center justify-center gap-1 w-full md:w-auto" style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#e5e7eb' }} aria-label="Toggle theme">
                    {isDark ? <Moon size={16} /> : <Sun size={16} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto p-3 md:p-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<Forgot />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-ride" element={<CreateRide />} />
            <Route path="/find-ride" element={<FindRide />} />
            <Route path="/track" element={<Track />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/driver-dashboard" element={<DriverDashboard />} />
            <Route path="/ride-bookings/:rideId" element={<RideBookings />} />
            <Route path="/debug" element={<Debug />} />
          </Routes>
          </motion.div>
        </main>
        <Footer />
        {/* Toasts */}
        <div className="fixed bottom-4 inset-x-0 flex justify-center pointer-events-none z-[100]">
          <div className="space-y-2 w-full max-w-md px-3">
            {toasts.map(t => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-lg px-4 py-2.5 text-sm shadow-lg ring-1 pointer-events-auto" style={{ background: t.type==='error' ? '#fee2e2' : t.type==='success' ? '#dcfce7' : '#f3f4f6', color: '#111', borderColor: 'rgba(0,0,0,0.06)' }}>
                {t.message}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
  );
}

export default App;
